// 中场觉醒力 7 天伴随手册配置
// 30 题（6 维度）按生活切片重组为 4 个场景簇
// 7 天脚本按 weakest dimension 匹配

import type { MidlifeDimension } from "@/components/midlife-awakening/midlifeAwakeningData";

export interface QuestionCluster {
  key: string;
  title: string;
  subtitle: string;
  questionIds: number[]; // 1-based
}

/** 4 个场景簇 */
export const MIDLIFE_CLUSTERS: QuestionCluster[] = [
  {
    key: 'inner_loop',
    title: '脑子里的那个圈',
    subtitle: '事情没发生，先在心里跑了 50 圈',
    questionIds: [1, 2, 3, 4, 5],
  },
  {
    key: 'self_worth',
    title: '"我够不够"那把尺',
    subtitle: '别人的一句话，比你自己 10 年的功夫更响',
    questionIds: [6, 7, 8, 9, 10],
  },
  {
    key: 'stuck_action',
    title: '想动又动不了',
    subtitle: '不是懒，是顾虑先把你按住了',
    questionIds: [11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
  },
  {
    key: 'support_meaning',
    title: '可托付与方向感',
    subtitle: '没人可以全程陪你，但你需要至少 1 个人替你看着',
    questionIds: [16, 17, 18, 19, 20, 26, 27, 28, 29, 30],
  },
];

/** 静态档位"心里话"模板（AI 失败兜底用，35-55 中年向口吻） */
export const MIDLIFE_FALLBACK_BY_SCORE: Record<number, string> = {
  0: '这一格还稳，是你这些年真正攒下的底，别让别的事悄悄抢走。',
  1: '有点松动了，是身体/情绪在小声跟你说一句，今晚少做一件不重要的事。',
  2: '这块在掉电了。不是矫情，是你这一段把自己排在了所有人之后。',
  3: '这块已经在亮红灯了。不是你不行，是你已经太久没替自己做过 1 件事了。',
};

export interface DayScript {
  day: number;
  title: string;
  morning: string;
  noon: string;
  evening: string;
  reassure: string;
}

const COMMON_REASSURE =
  '没做到也行。这 7 天不是逼你"再战一次"，是把"再来一次"从口号，变成你今晚就能做完的 5 分钟。';

/** 通用 7 天主轴：把"再来一次"落到 5 分钟动作 */
const COMMON_DAYS: DayScript[] = [
  { day: 1, title: '先承认卡住',          morning: '写下你最近 3 个月里"一直想做但没动"的 1 件事',          noon: '不评价、不解释',                                              evening: '今天哪一刻你最想"算了"？',                                 reassure: COMMON_REASSURE },
  { day: 2, title: '把内耗看清',          morning: '把 Day1 那件事卡住的真正原因写 3 行',                    noon: '中午看一眼，把"不是真理由"的那行划掉',                       evening: '剩下那一行，是你真正怕的东西吗？',                         reassure: COMMON_REASSURE },
  { day: 3, title: '缩小到 5 分钟',       morning: '把 Day1 那件事拆成 1 个 5 分钟以内能完成的动作',         noon: '不要拆 30 分钟、不要拆"想清楚"',                              evening: '拆完之后，是不是没那么吓人了？',                           reassure: COMMON_REASSURE },
  { day: 4, title: '做完那 5 分钟',       morning: '今天就做 1 次 Day3 拆出来的那个动作',                    noon: '不论效果，只论动了',                                          evening: '动完之后，今晚的睡眠会不会松一点？',                       reassure: COMMON_REASSURE },
  { day: 5, title: '找回意义半径',        morning: '写"如果 50 岁的我回头看今天，我希望我做了……"',           noon: '只写 1 句',                                                   evening: '把这句话留到下周再看',                                     reassure: COMMON_REASSURE },
  { day: 6, title: '找一个同代人',        morning: '给 1 个同代朋友发一段你这周的小动作',                    noon: '不为请教、不为抱怨',                                          evening: 'Ta 怎么回你的？',                                          reassure: COMMON_REASSURE },
  { day: 7, title: '中场宣言',            morning: '回看 Day1 的卡点',                                       noon: '写一句"我的中场，第一件事是……"',                             evening: '扫末页二维码，找顾问报名训练营',                           reassure: COMMON_REASSURE },
];

/** 6 套脚本，按 weakest dimension 微调 Day1 切入 */
export const MIDLIFE_SEVEN_DAYS: Record<MidlifeDimension, DayScript[]> = {
  internalFriction: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '让脑子先停一格', morning: '写下你今天反复想了 3 次以上的那 1 件事' } : d,
  ),
  selfWorth: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '把尺子收一收', morning: '写下你近一年完成得最得意的 1 件事，不与任何人比较' } : d,
  ),
  actionStagnation: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '把"想做"摆出来', morning: '写下你最近 3 个月"一直想做但没动"的 1 件事' } : d,
  ),
  supportSystem: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '让自己先开口', morning: '写下 1 个你今天本来想倾诉、却没开口的人的名字' } : d,
  ),
  regretRisk: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '把遗憾摆出来', morning: '写下"如果 5 年后回头，我最不想留下的遗憾是……"' } : d,
  ),
  missionClarity: COMMON_DAYS.map((d, i) =>
    i === 0 ? { ...d, title: '看见方向感', morning: '写下"我希望 5 年后的自己，正在做哪 1 件事"' } : d,
  ),
};

/** 中文 label，给雷达图用 */
export const MIDLIFE_DIM_LABEL: Record<MidlifeDimension, string> = {
  internalFriction: '内耗循环',
  selfWorth: '价值松动',
  actionStagnation: '行动停滞',
  supportSystem: '支持系统',
  regretRisk: '后悔风险',
  missionClarity: '使命清晰',
};

/** P8 训练营卡片 */
export const MIDLIFE_CAMP_INVITE = {
  campName: '中场觉醒 7 天微营',
  intro:
    '7 天你已经知道：中场不是终场，是你愿意"再来一次"的那一刻。但一个人扛得住一阵，扛不住一年。',
  values: [
    '每天 15 分钟教练带练，不耽误工作',
    '30 人同代人小群，35-55 同行者互相托底',
    '每天 1 个 5 分钟动作 · 1 张「中场进度卡」',
    '第 7 天 1v1 复盘 · 给你下一阶段的"中场宣言"',
  ],
  whyNotAlone:
    '中场最难的不是没动力，是没人替你看着。给自己一个不用一个人扛的下半场。',
  ctaHint: '扫码加顾问 · 报名领取早鸟价',
};
