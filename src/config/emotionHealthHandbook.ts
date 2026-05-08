// 情绪健康 7 天伴随手册配置
// 32 题按生活切片重组为 5 个场景簇
// 7 天脚本按主导反应模式（exhaustion/tension/suppression/avoidance）匹配

import type { PatternType } from '@/components/emotion-health/emotionHealthData';

export interface QuestionCluster {
  key: string;
  title: string;
  subtitle: string;
  questionIds: number[]; // 1-based, 对应 emotionHealthQuestions[].id
}

/** 5 个场景簇（用题目 id） */
export const FEMALE_CLUSTERS: QuestionCluster[] = [
  {
    key: 'body_signal',
    title: '身体的信号',
    subtitle: '不是你想多了，是身体先开口',
    questionIds: [1, 2, 3, 4, 6],
  },
  {
    key: 'mind_loop',
    title: '脑子的循环',
    subtitle: '事情没发生，先在心里演了 100 遍',
    questionIds: [5, 7, 8, 17, 19, 20],
  },
  {
    key: 'pressure',
    title: '撑住的代价',
    subtitle: '你不是太累，是太久没被替过班',
    questionIds: [9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    key: 'relation',
    title: '关系里的自己',
    subtitle: '为了不让别人累，你把自己藏起来了',
    questionIds: [18, 21, 22, 23, 24, 31],
  },
  {
    key: 'pause_avoid',
    title: '想动又动不了',
    subtitle: '不是懒，是情绪先把你按住了',
    questionIds: [25, 26, 27, 28, 29, 30, 32],
  },
];

/** 静态档位"心里话"模板（AI 失败兜底用，女性向口吻） */
export const FEMALE_FALLBACK_BY_SCORE: Record<number, string> = {
  0: '这一格你还稳着，先守住它，别让别的事悄悄抢走。',
  1: '有点苗头了，是身体或心在小声跟你说一句。',
  2: '这块在掉了。不是你太敏感，是这一段你被消耗得有点深。',
  3: '这块已经在求救了。不是你不够好，是太久没人替你接住一下。',
};

export interface DayScript {
  day: number;
  title: string;
  morning: string;
  noon: string;
  evening: string;
  reassure: string;
}

const COMMON_REASSURE = '没做到也没关系。这 7 天不是任务，是让你知道：原来你可以被自己温柔地对待。';

/** 4 套 7 天脚本，按 primaryPattern 匹配 */
export const FEMALE_SEVEN_DAYS: Record<PatternType, DayScript[]> = {
  exhaustion: [
    { day: 1, title: '先承认一下',         morning: '起床问自己：今天我感觉怎么样？',     noon: '吃饭时不边吃边干别的',         evening: '今天哪一刻最想躺下？',           reassure: COMMON_REASSURE },
    { day: 2, title: '给身体一个出口',     morning: '深呼吸 5 次再起床',                  noon: '找 5 分钟一个人待着',          evening: '今天身体哪里最紧？',             reassure: COMMON_REASSURE },
    { day: 3, title: '少替一个人',         morning: '今天少替家人做 1 件他自己能做的',    noon: '不主动揽不属于你的活',         evening: '今天你被自己心疼了吗？',         reassure: COMMON_REASSURE },
    { day: 4, title: '让自己被看见',       morning: '告诉一个人"我今天有点累"',          noon: '不解释、不补救、不微笑',        evening: '说完是什么感觉？',                reassure: COMMON_REASSURE },
    { day: 5, title: '把自己排进去',       morning: '今天有件事是为自己做的',             noon: '不是"该做"，是"想做"',          evening: '这件事让你想起谁？',              reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人靠近',       morning: '主动联系一个想见的人',               noon: '不为请教、不为解决',           evening: 'Ta 怎么回你的？',                 reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',        morning: '回看 7 天前的自己',                  noon: '看看你松了多少',               evening: '扫末页二维码，加顾问报名训练营', reassure: COMMON_REASSURE },
  ],
  tension: [
    { day: 1, title: '允许 80 分',         morning: '今天只要做到 80 分',                 noon: '错一件事不复盘超过 5 分钟',     evening: '今天放过自己一次了吗？',         reassure: COMMON_REASSURE },
    { day: 2, title: '让身体松一格',       morning: '起床做 4-7-8 呼吸 1 轮',             noon: '关键时刻前再做 1 轮',          evening: '今天最紧那一刻在哪？',            reassure: COMMON_REASSURE },
    { day: 3, title: '不抢方向盘',         morning: '今天有 1 件事让别人来定',            noon: '不暗自调整',                   evening: '让出方向盘是什么感觉？',          reassure: COMMON_REASSURE },
    { day: 4, title: '别先怪自己',         morning: '出问题时先问"是事情卡住了"',        noon: '而不是"我没做好"',              evening: '今天哪一刻你忍住了自责？',        reassure: COMMON_REASSURE },
    { day: 5, title: '休 25 分钟',         morning: '中午留 25 分钟什么都不做',           noon: '不看手机不开会',               evening: '休完是不是松了一点？',            reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人靠近',       morning: '告诉一个人你最近在调',               noon: '不解释完美',                   evening: '说出来后是什么感觉？',            reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',        morning: '回看 7 天前的紧',                    noon: '看看你松了多少',               evening: '扫末页二维码，加顾问报名训练营', reassure: COMMON_REASSURE },
  ],
  suppression: [
    { day: 1, title: '说一个真话',         morning: '今天跟一个人说"我有点不开心"',      noon: '不解释',                       evening: '今天哪句话憋回去了？',           reassure: COMMON_REASSURE },
    { day: 2, title: '写下来',             morning: '起床写 3 个词形容此刻',              noon: '中午写"今天最想说但没说的"',    evening: '看一眼，问问自己想要什么',        reassure: COMMON_REASSURE },
    { day: 3, title: '让身体先表达',       morning: '深呼吸 5 次',                        noon: '找 5 分钟一个人待着',          evening: '身体哪里在帮你说话？',            reassure: COMMON_REASSURE },
    { day: 4, title: '不当那个懂事的',     morning: '今天可以不秒回',                     noon: '让一件小事悬着',               evening: '谁让你最想"算了"？',              reassure: COMMON_REASSURE },
    { day: 5, title: '提一个小要求',       morning: '今天跟身边人提一个小要求',           noon: '不为对方解释',                 evening: '对方怎么回你？',                  reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人靠近',       morning: '主动联系一个想见的人',               noon: '不为请教、不为解决',           evening: 'Ta 怎么回你的？',                 reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',        morning: '回看 7 天前的沉默',                  noon: '看看你说出来了多少',           evening: '扫末页二维码，加顾问报名训练营', reassure: COMMON_REASSURE },
  ],
  avoidance: [
    { day: 1, title: '挑一件最小的',       morning: '挑今天躲了的事里最小的 1 件',        noon: '只做 5 分钟',                   evening: '今天哪件事在躲你？',              reassure: COMMON_REASSURE },
    { day: 2, title: '动 5 分钟',          morning: '设 5 分钟闹钟做那件事',              noon: '响了再决定要不要继续',         evening: '动起来后是不是没那么难？',        reassure: COMMON_REASSURE },
    { day: 3, title: '不等情绪好',         morning: '今天不等"想做"再做"',                noon: '难受也允许',                   evening: '哪一刻你撑过去了？',              reassure: COMMON_REASSURE },
    { day: 4, title: '让一个人陪',         morning: '让一个人陪你做那件事',               noon: '哪怕只是开个语音',             evening: '陪伴让你松了多少？',              reassure: COMMON_REASSURE },
    { day: 5, title: '别再骂自己',         morning: '今天不说"我怎么这么差"',            noon: '改说"我已经在动了"',           evening: '换一句话，心里有什么不一样？',    reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人靠近',       morning: '告诉一个人你最近在调',               noon: '不为请教、不为解决',           evening: 'Ta 怎么回你的？',                 reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',        morning: '回看 7 天前的卡点',                  noon: '看看你动了多少',               evening: '扫末页二维码，加顾问报名训练营', reassure: COMMON_REASSURE },
  ],
};

/** P8 训练营卡片 */
export const FEMALE_CAMP_INVITE = {
  campName: '35+ 女性绽放营',
  intro: '7 天你已经知道，原来你不是病了，是太久没被听见。但被听见这件事，一个人做不到。',
  values: [
    '黛汐老师每天 1 节带练 · 7 天连续',
    '30 人姐妹小群，被听见、被陪着',
    '每日情绪日记本 + 关系练习卡',
    '第 7 天 1v1 复盘 · 给你下一步方向',
  ],
  whyNotAlone: '被看见这件事，没法一个人完成。给自己一个被陪着走的开始。',
  ctaHint: '扫码加顾问 · 报名领取早鸟价',
};
