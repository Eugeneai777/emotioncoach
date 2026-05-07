/**
 * 测评领取码工具：本地展示与格式化。
 * 实际生成由数据库触发器负责（partner_assessment_results.claim_code）。
 */

/** 把 6 位领取码格式化为「M7K 9P2」便于阅读 */
export function formatClaimCode(code?: string | null): string {
  if (!code) return "------";
  const clean = code.toUpperCase().replace(/\s+/g, "");
  if (clean.length !== 6) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

/** 校验领取码格式（6 位字符集 23456789ABCDEFGHJKMNPQRSTUVWXYZ） */
export function isValidClaimCode(code: string): boolean {
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(code.toUpperCase());
}
