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

// =====================================================================
// 4 屏漏斗化重排 (A 方案) 配套数据
// =====================================================================

export type VitalityDimensionKey =
  | 'nerve_tension'
  | 'chronic_fatigue'
  | 'mood_baseline'
  | 'performance_anxiety'
  | 'core_drive';

/** 5 维度 × 3 条认知盲区 — 戳穿"中年男人没说出口的事" */
export const BLIND_SPOT_BY_DIMENSION: Record<VitalityDimensionKey, string[]> = {
  nerve_tension: [
    '你以为是"忙",其实大脑 24 小时没真正下过班。',
    '刷手机不是放松,是神经在用一种更廉价的方式自我麻痹。',
    '你没在恢复,只是在硬扛——身体的账,迟早一次性结清。',
  ],
  chronic_fatigue: [
    '你以为是"年纪到了",其实是连续多年睡眠债没还。',
    '不是不想睡,是身体已经忘了怎么进入深度修复。',
    '咖啡能续命,但代偿出来的精力,正在透支你 40 岁后的底盘。',
  ],
  mood_baseline: [
    '你不是脾气变差,是心里那块"备用电池"早就空了。',
    '对家人没耐心,常常不是不爱,是你已经没有多余电量给情绪了。',
    '"我没事"说久了,连你自己都信了——其实你已经很久没有真正快乐过。',
  ],
  performance_anxiety: [
    '关键时刻硬撑,不是你强,是你怕一旦松下来就再也起不来。',
    '你怕的不是失败,是"被看见自己原来也撑不住"。',
    '靠肾上腺素续命的状态,赢了表面,输的是身体和家人的时间。',
  ],
  core_drive: [
    '你以为是"中年没劲",其实是太久没为自己活过一件事。',
    '所有目标都在为别人(公司/家庭/孩子),你忘了自己真正想要什么。',
    '动力低不是病,是身体在替你说"再这么活下去,我罢工了"。',
  ],
};

/** 5 维度 × 3 条即刻行动 — 今晚 / 本周可落地 */
export const IMMEDIATE_ACTIONS_BY_DIMENSION: Record<VitalityDimensionKey, string[]> = {
  nerve_tension: [
    '今晚 22:30 把手机放到客厅充电,卧室物理隔离。',
    '明天上午挑 1 个会,会前做 3 次"4-7-8"呼吸再开口。',
    '本周给自己安排一次 30 分钟"什么都不做"的窗口。',
  ],
  chronic_fatigue: [
    '今晚 11 点前躺下,哪怕睡不着,也让身体先归位。',
    '明天下午 3 点不喝咖啡,改用 10 分钟快走唤醒。',
    '本周挑 2 天提前 1 小时收工,把恢复当 KPI。',
  ],
  mood_baseline: [
    '今晚回家先和家人说一句"今天还好吗",再看手机。',
    '明天写下 3 件"今天我做到了"的小事,再小也算。',
    '本周和 1 个老朋友通 1 次电话,只聊近况不聊事。',
  ],
  performance_anxiety: [
    '挑 1 个本周关键场合,提前 5 分钟做"4-7-8"呼吸。',
    '今晚把"我必须赢"换成"我尽力就好",写下来。',
    '本周允许自己拒绝 1 个新承诺,把节奏让回来。',
  ],
  core_drive: [
    '今晚写下 1 件"如果不为任何人,我想做的事"。',
    '本周给自己留 1 小时,只做这件事,不解释。',
    '本月找 1 个能说真话的人,把"我想要什么"说出口。',
  ],
};

/** 通用 fallback */
export const FALLBACK_BLIND_SPOTS: string[] = [
  '你以为是"中年的常态",其实是身体长期透支后的报警。',
  '你不是不行,是太久没有给自己真正的恢复窗口。',
  '"再撑一下"撑出来的,不是更强,是更深的债。',
];
export const FALLBACK_IMMEDIATE_ACTIONS: string[] = [
  '今晚 22:30 前放下手机,让大脑提前 1 小时下班。',
  '明天选 1 件最弱维度的小事,只做 10 分钟。',
  '本周拒绝 1 个本不该是你扛的承诺。',
];

/** 5 个 MBTI 风格状态标签 — 给中年男性"被看见"的认同感 */
export const MBTI_STYLE_TAGS_BY_LEVEL: Record<'full' | 'half' | 'low', string[]> = {
  full: ['SR-稳态续航型', 'EN-能量充沛型', 'CL-思路清明型', 'BS-底盘扎实型', 'OW-开放有度型'],
  half: ['HD-硬扛代偿型', 'NM-夜间补偿型', 'KP-关键场合紧绷型', 'SC-自我克制型', 'MS-情绪沉默型'],
  low: ['LB-低电运行型', 'OW-超载预警型', 'AF-逃避刷屏型', 'GH-硬撑硬抗型', 'NS-自我消音型'],
};

/** 找到"最弱"维度 (raw score 越高 = 阻力越大 = 越弱) */
export function getWeakestDimensionKey(
  dimensionScores: Array<{ key?: string; score: number; maxScore: number }>
): VitalityDimensionKey | null {
  const valid = dimensionScores.filter((d) => d.key && d.maxScore > 0);
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore));
  const key = sorted[0].key as string;
  if ((['nerve_tension','chronic_fatigue','mood_baseline','performance_anxiety','core_drive'] as const).includes(key as VitalityDimensionKey)) {
    return key as VitalityDimensionKey;
  }
  return null;
}
