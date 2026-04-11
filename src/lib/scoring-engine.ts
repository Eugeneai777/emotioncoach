/**
 * 插件化评分引擎
 * 
 * 支持的评分类型：
 * - additive: 默认维度加分
 * - weighted: 加权计分
 * - clinical: 临床因子分析（如 SCL-90）
 * - custom: 自定义公式（通过 scoring_logic JSON 配置）
 */

export interface DimensionConfig {
  key: string;
  label: string;
  emoji: string;
  maxScore?: number;
  weight?: number;
  questionIndices?: number[]; // For clinical: which questions belong to this factor
}

export interface QuestionConfig {
  text: string;
  dimension: string;
  positive?: boolean;
  options?: { label: string; score: number }[];
  factor?: string; // For clinical scoring
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  dimensionScores: DimensionScore[];
  primaryPattern: any;
  /** Extra data specific to scoring type (e.g. clinical severity levels) */
  meta?: Record<string, any>;
}

export interface DimensionScore {
  key?: string;
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
  /** For clinical: average score per factor */
  average?: number;
  severity?: string;
}

export interface PatternConfig {
  label: string;
  emoji?: string;
  description?: string;
  traits?: string[];
  tips?: string[];
  scoreRange?: { min: number; max: number };
}

// ========== Scoring Strategies ==========

function scoreAdditive(
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  const dimScores: Record<string, DimensionScore> = {};
  dimensions.forEach((d) => {
    dimScores[d.key] = {
      key: d.key,
      score: 0,
      maxScore: d.maxScore || 0,
      label: d.label,
      emoji: d.emoji,
    };
  });

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (ans !== undefined && dimScores[q.dimension]) {
      dimScores[q.dimension].score += ans;
    }
  });

  const dimensionScores = Object.values(dimScores);
  const totalScore = dimensionScores.reduce((s, d) => s + d.score, 0);
  const maxScore = dimensionScores.reduce((s, d) => s + d.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const primaryPattern = matchPattern(percentage, patterns);

  return { totalScore, maxScore, percentage, dimensionScores, primaryPattern };
}

function scoreWeighted(
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  const dimScores: Record<string, DimensionScore> = {};
  dimensions.forEach((d) => {
    dimScores[d.key] = {
      key: d.key,
      score: 0,
      maxScore: d.maxScore || 0,
      label: d.label,
      emoji: d.emoji,
    };
  });

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (ans !== undefined && dimScores[q.dimension]) {
      dimScores[q.dimension].score += ans;
    }
  });

  // Apply dimension weights
  const dimensionScores = Object.values(dimScores);
  let totalScore = 0;
  let maxScore = 0;
  dimensionScores.forEach((ds) => {
    const dim = dimensions.find((d) => d.key === ds.key);
    const weight = dim?.weight || 1;
    totalScore += ds.score * weight;
    maxScore += ds.maxScore * weight;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const primaryPattern = matchPattern(percentage, patterns);

  return { totalScore, maxScore, percentage, dimensionScores, primaryPattern };
}

function scoreClinical(
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  // Clinical scoring: calculate factor averages (e.g. SCL-90 style)
  const dimScores: Record<string, { total: number; count: number; config: DimensionConfig }> = {};
  dimensions.forEach((d) => {
    dimScores[d.key] = { total: 0, count: 0, config: d };
  });

  questions.forEach((q, i) => {
    const ans = answers[i];
    const factorKey = q.factor || q.dimension;
    if (ans !== undefined && dimScores[factorKey]) {
      dimScores[factorKey].total += ans;
      dimScores[factorKey].count += 1;
    }
  });

  const dimensionScores: DimensionScore[] = Object.entries(dimScores).map(([key, val]) => {
    const average = val.count > 0 ? val.total / val.count : 0;
    return {
      key,
      score: val.total,
      maxScore: val.config.maxScore || val.count * 4, // default max per item = 4
      label: val.config.label,
      emoji: val.config.emoji,
      average: Math.round(average * 100) / 100,
      severity: getClinicalSeverity(average),
    };
  });

  const totalScore = dimensionScores.reduce((s, d) => s + d.score, 0);
  const totalItems = questions.length;
  const globalAverage = totalItems > 0 ? totalScore / totalItems : 0;
  const maxScore = totalItems * 4; // Clinical scales typically max at 4
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const primaryPattern = matchPattern(percentage, patterns);

  return {
    totalScore,
    maxScore,
    percentage,
    dimensionScores,
    primaryPattern,
    meta: {
      globalAverage: Math.round(globalAverage * 100) / 100,
      positiveItemCount: Object.values(answers).filter((v) => v >= 2).length,
      totalItems,
    },
  };
}

// ========== Helpers ==========

function matchPattern(percentage: number, patterns: PatternConfig[]): PatternConfig | undefined {
  if (!patterns?.length) return undefined;
  for (const p of patterns) {
    if (p.scoreRange && percentage >= p.scoreRange.min && percentage <= p.scoreRange.max) {
      return p;
    }
  }
  return patterns[0];
}

function getClinicalSeverity(average: number): string {
  if (average < 1.5) return "正常";
  if (average < 2.0) return "轻度";
  if (average < 2.5) return "中度";
  if (average < 3.0) return "中重度";
  return "重度";
}

// ========== Registry ==========

type ScoringFn = (
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
) => ScoringResult;

import { scoreSBTI } from './sbti-scoring';

const scoringRegistry: Record<string, ScoringFn> = {
  additive: scoreAdditive,
  weighted: scoreWeighted,
  clinical: scoreClinical,
  sbti: scoreSBTI,
};

/**
 * Register a custom scoring strategy
 */
export function registerScoringStrategy(type: string, fn: ScoringFn) {
  scoringRegistry[type] = fn;
}

/**
 * Calculate assessment result using the appropriate scoring strategy
 */
export function calculateScore(
  scoringType: string,
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  const scoreFn = scoringRegistry[scoringType] || scoringRegistry.additive;
  return scoreFn(answers, questions, dimensions, patterns);
}
