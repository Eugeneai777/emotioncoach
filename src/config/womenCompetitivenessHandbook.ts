// 35+ 女性竞争力 7 天伴随手册配置
// 27 题（5 维度）按生活切片重组为 4 个场景簇
// 7 天脚本按 weakest_category 匹配

import type { CompetitivenessCategory } from "@/components/women-competitiveness/competitivenessData";

export interface QuestionCluster {
  key: string;
  title: string;
  subtitle: string;
  questionIds: number[]; // 1-based, 对应 questions[].id
}

/** 4 个场景簇（用题目 id） */
export const WOMEN_CLUSTERS: QuestionCluster[] = [
  {
    key: 'workplace',
    title: '在职场里的你',
    subtitle: '不是不行，是没人替你说"你已经很厉害了"',
    questionIds: [1, 2, 3, 4, 5, 6],
  },
  {
    key: 'visibility',
    title: '被看见这件事',
    subtitle: '你做得太多，说得太少',
    questionIds: [7, 8, 9, 10, 11, 12],
  },
  {
    key: 'inner_resilience',
    title: '心里那道弦',
    subtitle: '别人随口一句，你要拆解三天',
    questionIds: [13, 14, 15, 16, 17],
  },
  {
    key: 'money_relations',
    title: '底气与同盟',
    subtitle: '钱包的厚度、朋友的密度，都是你的筹码',
    questionIds: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
  },
];

/** 静态档位"心里话"模板（AI 失败兜底用，35+ 女性向口吻） */
export const WOMEN_FALLBACK_BY_SCORE: Record<number, string> = {
  0: '这一格你还撑着，是你 35 岁后真正长出来的肌肉，先别让别的事来抢它。',
  1: '有点松动了，是你这阵子被"应该"压得有点深。',
  2: '这块在掉了。不是你不够好，是你已经太久没有人替你说一句"我看见你了"。',
  3: '这块已经在求救了。不是你输给了年龄，是你的筹码一直没有被你自己亮出来。',
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
  '没做到也行。这 7 天不是逼你"再厉害一点"，是让你看清：35+ 的你，真正值钱的是什么。';

/** 通用 7 天主轴（不卷年轻、不比赛道，把已有筹码亮出来） */
const COMMON_DAYS: DayScript[] = [
  { day: 1, title: '看见盘面',           morning: '写下你 35 岁后增加的 3 项无可替代的能力',                  noon: '中午找一件你近一年完成得最得意的事，在心里说一遍',          evening: '今晚问自己：今天我有没有低估自己？',                       reassure: COMMON_REASSURE },
  { day: 2, title: '拆掉假对手',          morning: '列 1 个你一直在比的人，写她不知道的你 3 个底牌',           noon: '中午把那张纸再看一眼，把"她有的我没有"那句话划掉',         evening: '比她少的那项，是不是你根本不想要的？',                     reassure: COMMON_REASSURE },
  { day: 3, title: '把"应该"放下一格',    morning: '选 1 件本周本来"应该"做的事，主动延后 24 小时',           noon: '不解释、不补救',                                            evening: '延后之后，谁真的崩塌了？',                                 reassure: COMMON_REASSURE },
  { day: 4, title: '让一个人看见你',      morning: '给 1 个老朋友发一句"我最近在做……"',                       noon: '不为请教、不为求职',                                        evening: '她回了什么？把那一句留下来',                               reassure: COMMON_REASSURE },
  { day: 5, title: '把无形资产作价',      morning: '挑 1 项你从不收钱的能力，给它定一个时薪',                  noon: '中午写"如果我开始按时薪报价，我会先告诉谁"',                evening: '把这个时薪写进备忘录，留 7 天再看',                        reassure: COMMON_REASSURE },
  { day: 6, title: '占一个能见的位',      morning: '在你日常的群/朋友圈，主动发一次专业观点（≤80 字）',        noon: '不预判反响',                                                evening: '今天有几个人跟你私聊过这条？',                             reassure: COMMON_REASSURE },
  { day: 7, title: '第 8 天去哪',         morning: '回看 Day1 那张纸',                                         noon: '写一句"35+ 的我，最值钱的不是……，而是……"',                evening: '扫末页二维码，找顾问报名训练营',                           reassure: COMMON_REASSURE },
];

/** 5 套 7 天脚本，按 weakest_category 切分主轴重点（公共模板基础上微调 Day1 切入） */
export const WOMEN_SEVEN_DAYS: Record<CompetitivenessCategory, DayScript[]> = {
  career: COMMON_DAYS.map((d, i) =>
    i === 0
      ? { ...d, title: '把职场盘面摆出来', morning: '写下你 35 岁后真正擅长的 3 件事，不写"应该会"' }
      : d,
  ),
  brand: COMMON_DAYS.map((d, i) =>
    i === 0
      ? { ...d, title: '先把自己看见', morning: '写一句你能"对外说出口"的、不脸红的自我介绍' }
      : d,
  ),
  resilience: COMMON_DAYS.map((d, i) =>
    i === 0
      ? { ...d, title: '允许自己琢磨', morning: '写下最近 1 句让你琢磨了好几天的话，再写它"其实不重要"的理由' }
      : d,
  ),
  finance: COMMON_DAYS.map((d, i) =>
    i === 0
      ? { ...d, title: '先把账面看清', morning: '写下你的存款支撑你独立生活几个月' }
      : d,
  ),
  relationship: COMMON_DAYS.map((d, i) =>
    i === 0
      ? { ...d, title: '盘点身边的人', morning: '写下当你跌倒时，3 个会主动接住你的人的名字' }
      : d,
  ),
};

/** P8 训练营卡片 */
export const WOMEN_CAMP_INVITE = {
  campName: '她的中场 · 重新出牌 7 天微营',
  intro:
    '7 天你已经知道：你不是输给年龄、输给 95 后，你只是太久没把已有的筹码摆到桌面上。下一步，你需要一群同代人替你看见。',
  values: [
    '黛汐老师每天 1 节带练 · 7 天连续，不灌"再厉害一点"',
    '30 人同代姐妹圈 · 把你不敢说的话先在这里说出口',
    '每日 1 张「我的筹码盘」+ 1 个 5 分钟动作',
    '第 7 天 1v1 复盘 · 给你下一个"再出牌"的方向',
  ],
  whyNotAlone:
    '35+ 的竞争力，不是一个人卷出来的，是被一群同代人看见、托住、再出牌出来的。',
  ctaHint: '扫码加顾问 · 报名领取早鸟价',
};
