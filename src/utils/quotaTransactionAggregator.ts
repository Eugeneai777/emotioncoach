/**
 * 点数流水聚合工具
 *
 * 背景：语音通话按 8 点 / 分钟实时扣费，quota_transactions 每分钟会写一条 -8 记录。
 * 为避免用户在「点数明细」看到大量碎片化记录，本工具将"同一次通话"的多条按分钟扣费
 * 流水合并为一条聚合展示记录。
 *
 * 聚合规则：
 *   - 仅对 amount < 0（消费）且 source 属于语音类的记录进行合并
 *   - 同一 user + 同一 source + 时间间隔 ≤ 90 秒 + 同一日（CST）连续多条 → 合并为 1 条
 *   - 充值（amount > 0）、退款、非语音消费保持原样
 *
 * 不修改数据库，纯前端聚合，历史记录与未来记录均生效。
 */

export interface RawQuotaTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  source: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface AggregatedQuotaTransaction extends RawQuotaTransaction {
  /** 是否为聚合记录（合并了多条原始流水） */
  isAggregated?: boolean;
  /** 该次通话计费分钟数（= 合并的原始记录条数） */
  duration_minutes?: number;
  /** 原始流水数量 */
  raw_count?: number;
  /** 该次通话结束时间（最后一条扣费记录） */
  ended_at?: string;
  /** 合并的原始流水（用于"展开查看分钟明细"） */
  raw_items?: RawQuotaTransaction[];
}

/** 判断 source 是否属于"按分钟实时扣费的语音通话"类型 */
const isVoiceCallSource = (source: string | null): boolean => {
  if (!source) return false;
  // 涵盖所有 realtime_voice_* 以及通用 voice_chat / coach_voice
  return (
    source.startsWith("realtime_voice") ||
    source === "voice_chat" ||
    source === "coach_voice"
  );
};

/** 是否同一日（按本地时区，便于按日对账，不跨日合并） */
const isSameLocalDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

/** 间隔 ≤ 90 秒（留 30 秒缓冲，避免网络抖动切分一次通话） */
const MERGE_GAP_MS = 90 * 1000;

/**
 * 将原始流水按时间倒序数组聚合为展示数组。
 * 输入要求：transactions 已按 created_at 倒序排列。
 */
export function aggregateQuotaTransactions(
  transactions: RawQuotaTransaction[]
): AggregatedQuotaTransaction[] {
  if (!transactions || transactions.length === 0) return [];

  // 为方便相邻判断，先按时间升序，分组后再翻转回倒序输出
  const asc = [...transactions].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const groups: RawQuotaTransaction[][] = [];

  for (const tx of asc) {
    const canMerge =
      isVoiceCallSource(tx.source) && tx.amount < 0;

    if (!canMerge) {
      groups.push([tx]);
      continue;
    }

    const lastGroup = groups[groups.length - 1];
    const last = lastGroup?.[lastGroup.length - 1];

    if (
      last &&
      isVoiceCallSource(last.source) &&
      last.amount < 0 &&
      last.source === tx.source &&
      isSameLocalDay(last.created_at, tx.created_at) &&
      new Date(tx.created_at).getTime() -
        new Date(last.created_at).getTime() <=
        MERGE_GAP_MS
    ) {
      lastGroup.push(tx);
    } else {
      groups.push([tx]);
    }
  }

  // 转换为聚合结构
  const aggregated: AggregatedQuotaTransaction[] = groups.map((group) => {
    if (group.length === 1) {
      return { ...group[0] };
    }
    // 合并：amount 累加；created_at 取首条（通话开始）；展示时长 = 条数
    const totalAmount = group.reduce((s, t) => s + t.amount, 0);
    const first = group[0];
    const last = group[group.length - 1];
    return {
      ...first,
      amount: totalAmount,
      // 余额取该次通话最后一笔扣费后的余额
      balance_after: last.balance_after,
      isAggregated: true,
      duration_minutes: group.length,
      raw_count: group.length,
      ended_at: last.created_at,
      raw_items: [...group].reverse(), // 展开时按倒序便于阅读
    };
  });

  // 输出按时间倒序
  return aggregated.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
