/**
 * Shared utilities for building bundle descriptions.
 * Used by both PartnerProductBundles (sync on save) and BundlePublishPreview (initial publish).
 */

interface AiContent {
  target_audience: string;
  pain_points: string;
  solution: string;
  expected_results: string;
}

export function normalizeContent(text: string): string {
  if (!text || text.includes('✅') || text.includes('\n')) return text;
  const sentences = text.split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length <= 1) return text;
  return sentences.map(s => `✅ ${s}`).join('\n');
}

export function buildBundleDescription(aiContent: AiContent | null): string {
  if (!aiContent) return '';
  const sections = [
    aiContent.target_audience && `### 适合谁\n${normalizeContent(aiContent.target_audience)}`,
    aiContent.pain_points && `### 解决什么问题\n${normalizeContent(aiContent.pain_points)}`,
    aiContent.solution && `### 我们如何帮你\n${normalizeContent(aiContent.solution)}`,
    aiContent.expected_results && `### 你将收获\n${normalizeContent(aiContent.expected_results)}`,
  ].filter(Boolean);
  return sections.join('\n\n');
}
