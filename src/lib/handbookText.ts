/** 清除 AI 输出的脏字符（控制符 + 零宽字符） */
export function sanitizeHandbookText(s: string | null | undefined): string {
  if (!s) return '';
  return String(s).replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, '').trim();
}
