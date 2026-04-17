/**
 * SBTI (Silly Big Personality Test) 评分策略
 * 
 * 15 维度 × 27 种人格类型
 * 匹配逻辑：维度归一化为 H/M/L，通过汉明距离匹配最近的人格模式
 */

import type { QuestionConfig, DimensionConfig, PatternConfig, ScoringResult, DimensionScore } from './scoring-engine';
import { SBTI_PATTERNS, DIMENSION_DESCRIPTORS } from './sbti-personality-data';

// H/M/L levels
type Level = 'H' | 'M' | 'L';

// Dimension order for pattern matching
const DIMENSION_ORDER = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];

function normalizeToLevel(score: number, maxScore: number): Level {
  if (maxScore <= 0) return 'M';
  const ratio = score / maxScore;
  if (ratio > 0.66) return 'H';
  if (ratio >= 0.33) return 'M';
  return 'L';
}

function hammingDistance(a: Level[], b: Level[]): number {
  let dist = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function scoreSBTI(
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  // 1. Calculate raw dimension scores
  const dimScores: Record<string, { total: number; count: number; maxPerQ: number }> = {};
  dimensions.forEach((d) => {
    dimScores[d.key] = { total: 0, count: 0, maxPerQ: 3 }; // A/B/C/D → 3/2/1/0
  });

  // Check for DRUNK trigger (question with dimension "DRUNK_TRIGGER")
  let drunkTriggered = false;

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (ans === undefined || ans === null) return;

    // Skip "escape" options (score: null / skip: true) — user marked the scenario as not applicable
    const opt = (q as any).options?.[ans];
    if (opt && (opt.skip === true || opt.score === null || opt.score === undefined)) return;

    // Use the option's actual score (supports skip-aware indexing)
    const optScore = typeof opt?.score === 'number' ? opt.score : ans;

    if (q.dimension === 'DRUNK_TRIGGER' || q.factor === 'DRUNK_TRIGGER') {
      if (optScore === 0) drunkTriggered = true;
      return;
    }

    const dimKey = q.factor || q.dimension;
    if (dimScores[dimKey]) {
      dimScores[dimKey].total += optScore;
      dimScores[dimKey].count += 1;
    }
  });

  // 2. Build dimension scores array and H/M/L levels
  const userLevels: Level[] = [];
  const dimensionScoreResults: DimensionScore[] = [];

  DIMENSION_ORDER.forEach((key) => {
    const dim = dimensions.find(d => d.key === key);
    const raw = dimScores[key];
    if (!dim || !raw) {
      userLevels.push('M');
      return;
    }
    const maxScore = raw.count * raw.maxPerQ;
    const level = normalizeToLevel(raw.total, maxScore);
    userLevels.push(level);

    // Get dimension-specific descriptor
    const descriptor = DIMENSION_DESCRIPTORS[key]?.[level] || '';

    dimensionScoreResults.push({
      key,
      score: raw.total,
      maxScore,
      label: dim.label,
      emoji: dim.emoji,
      severity: level,
      average: descriptor ? undefined : undefined,
    });
  });

  // 3. Match personality type
  let matchedKey = 'HHHH'; // fallback
  let minDist = Infinity;

  if (drunkTriggered) {
    matchedKey = 'DRUNK';
  } else {
    for (const [pKey, pData] of Object.entries(SBTI_PATTERNS)) {
      if (pKey === 'DRUNK') continue;
      const dist = hammingDistance(userLevels, pData.pattern);
      if (dist < minDist) {
        minDist = dist;
        matchedKey = pKey;
      }
    }
  }

  const matched = SBTI_PATTERNS[matchedKey];
  const totalScore = dimensionScoreResults.reduce((s, d) => s + d.score, 0);
  const maxScore = dimensionScoreResults.reduce((s, d) => s + d.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 50;

  // Build dimension descriptors for result display
  const dimensionDescriptors: Record<string, string> = {};
  DIMENSION_ORDER.forEach((key, i) => {
    const level = userLevels[i];
    dimensionDescriptors[key] = DIMENSION_DESCRIPTORS[key]?.[level] || '';
  });

  // Build primaryPattern compatible with existing PatternConfig
  const primaryPattern = {
    label: matched.label,
    emoji: matched.emoji,
    description: matched.description,
    traits: matched.traits,
    tips: [], // No tips for entertainment test
    scoreRange: { min: 0, max: 100 },
  };

  return {
    totalScore,
    maxScore,
    percentage,
    dimensionScores: dimensionScoreResults,
    primaryPattern,
    meta: {
      sbtiType: matchedKey,
      subtitle: matched.subtitle,
      quote: matched.quote,
      imageUrl: matched.imageUrl,
      userLevels: Object.fromEntries(DIMENSION_ORDER.map((k, i) => [k, userLevels[i]])),
      dimensionDescriptors,
      matchDistance: drunkTriggered ? 0 : minDist,
      isDrunkTrigger: drunkTriggered,
    },
  };
}
