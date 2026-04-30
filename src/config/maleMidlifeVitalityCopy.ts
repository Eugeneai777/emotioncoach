// 男人有劲状态测评 - 男性向语言映射
// 用于历史对比叙事，把研发口径(原始分)翻译成"中年男性能听懂"的状态语言

export interface StatusBand {
  level: 'full' | 'half' | 'low';
  /** 用于 Tailwind 主色 className 后缀，例:emerald / amber / rose */
  color: 'emerald' | 'amber' | 'rose';
  /** 一句话定调 */
  headline: string;
  /** 对应阶段的副标语 */
  subline: string;
  /** 主推 CTA key */
  ctaPrimary: 'coach' | 'camp' | 'recheck';
}

/** 维度原始 label → 男性向状态短标签 */
export const VITALITY_STATUS_LABEL: Record<string, string> = {
  '精力续航': '电量',
  '睡眠修复': '修复力',
  '压力内耗': '抗压阀门',
  '压力调节': '抗压阀门',
  '关键时刻信心': '顶事力',
  '关系温度': '家里温度',
  '恢复阻力': '恢复速度',
  '行动恢复力': '恢复速度',
};

/** 加分文案(状态变好) */
const DELTA_UP_COPY: Record<string, string> = {
  '精力续航': '白天更扛造了',
  '睡眠修复': '夜里能真正关机了',
  '压力内耗': '压得住事了',
  '压力调节': '压得住事了',
  '关键时刻信心': '关键场合更稳了',
  '关系温度': '和家人能松下来了',
  '恢复阻力': '跌倒后爬起更快了',
  '行动恢复力': '跌倒后爬起更快了',
};

/** 减分文案(状态变差) */
const DELTA_DOWN_COPY: Record<string, string> = {
  '精力续航': '下午就开始没电',
  '睡眠修复': '睡了像没睡',
  '压力内耗': '心里那根弦还在崩',
  '压力调节': '心里那根弦还在崩',
  '关键时刻信心': '关键时候还在硬撑',
  '关系温度': '回家还是装着',
  '恢复阻力': '状态掉了拉不回',
  '行动恢复力': '状态掉了拉不回',
};

/** 持平文案 */
const DELTA_FLAT_COPY: Record<string, string> = {
  '精力续航': '电量稳住了',
  '睡眠修复': '睡眠节律没崩',
  '压力内耗': '压力没再加码',
  '压力调节': '压力没再加码',
  '关键时刻信心': '关键时刻状态稳定',
  '关系温度': '家里温度照旧',
  '恢复阻力': '恢复速度没掉',
  '行动恢复力': '恢复速度没掉',
};

/** 基于最弱维度的"本周一个动作" */
const WEEK_ACTION: Record<string, string> = {
  '精力续航': '本周只做一件事:每天 15 分钟下午快走,把"昏沉时段"拉起来。',
  '睡眠修复': '本周只做一件事:睡前 10 分钟把手机放客厅,先让大脑离线。',
  '压力内耗': '本周只做一件事:每晚临睡前写 3 行"今天扔掉了什么",清缓存。',
  '压力调节': '本周只做一件事:每晚临睡前写 3 行"今天扔掉了什么",清缓存。',
  '关键时刻信心': '本周只做一件事:挑 1 个关键场合,提前 5 分钟做"4-7-8 呼吸"。',
  '关系温度': '本周只做一件事:每天回家先和家人说一句"今天还好吗",再看手机。',
  '恢复阻力': '本周只做一件事:状态掉的时候,设 25 分钟"什么都不做"的恢复窗。',
  '行动恢复力': '本周只做一件事:状态掉的时候,设 25 分钟"什么都不做"的恢复窗。',
};

const DEFAULT_ACTION = '本周只做一件事:挑一项最弱的维度,每天给它 10 分钟。';

/** 状态指数 → 三档分级(电量比喻) */
export function getStatusBand(pct: number): StatusBand {
  if (pct >= 80) {
    return {
      level: 'full',
      color: 'emerald',
      headline: '满电状态',
      subline: '保持现在的节奏,7 天后再校准一次。',
      ctaPrimary: 'recheck',
    };
  }
  if (pct >= 50) {
    return {
      level: 'half',
      color: 'amber',
      headline: '半电状态',
      subline: '不是出事,是该微调了。先把最弱那一项拉起来。',
      ctaPrimary: 'camp',
    };
  }
  return {
    level: 'low',
    color: 'rose',
    headline: '低电预警',
    subline: '别一个人硬扛。先做一次 1v1 拆解,把节奏理清。',
    ctaPrimary: 'coach',
  };
}

/** 维度变化 → 一句话生活化文案 */
export function getDeltaCopy(label: string, deltaPct: number): string {
  if (deltaPct > 1) return DELTA_UP_COPY[label] || '这一项往上走了。';
  if (deltaPct < -1) return DELTA_DOWN_COPY[label] || '这一项掉了一些。';
  return DELTA_FLAT_COPY[label] || '这一项稳住了。';
}

/** 最弱维度 → 本周行动 */
export function getActionForWeakestDimension(label: string): string {
  return WEEK_ACTION[label] || DEFAULT_ACTION;
}

/** 状态指数 → 短情绪词(用于 badge) */
export function getStatusToneText(pct: number): string {
  if (pct >= 80) return '稳';
  if (pct >= 60) return '可调整';
  if (pct >= 40) return '需留意';
  return '优先恢复';
}

/** 把维度短标签返回(显示用) */
export function getStatusLabel(rawLabel: string): string {
  return VITALITY_STATUS_LABEL[rawLabel] || rawLabel;
}
