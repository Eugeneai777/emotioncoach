// 男人有劲 7 天伴随手册配置
// 场景簇：把 20 题按生活切片重组（不按维度排列）
// 7 天脚本：按"最弱维度"匹配一套接地气的早/午/晚动作

/** 题号（1-based）→ 维度 key 映射，与 partner_assessment_templates 中的 questions 顺序一致 */
export const MALE_QUESTION_DIMENSIONS = [
  'energy', 'energy', 'energy', 'energy',           // Q1-4 精力续航
  'sleep', 'sleep', 'sleep',                          // Q5-7 睡眠修复
  'stress', 'stress', 'stress', 'stress',             // Q8-11 压力内耗
  'confidence', 'confidence', 'confidence',           // Q12-14 信心
  'relationship', 'relationship', 'relationship',     // Q15-17 关系温度
  'recovery', 'recovery', 'recovery',                 // Q18-20 恢复阻力
] as const;

export interface QuestionCluster {
  key: string;
  title: string;
  subtitle: string;
  questionIndexes: number[]; // 0-based
}

/** 4 个场景簇 */
export const MALE_CLUSTERS: QuestionCluster[] = [
  {
    key: 'daytime',
    title: '白天的电量',
    subtitle: '下午三点，你在哪？',
    questionIndexes: [0, 1, 2, 3],
  },
  {
    key: 'night',
    title: '夜里的修复',
    subtitle: '关了灯，脑子还没关',
    questionIndexes: [4, 5, 6],
  },
  {
    key: 'pressure',
    title: '关键时刻',
    subtitle: '越是大场面，越使不上劲',
    questionIndexes: [7, 8, 9, 10, 11, 12, 13],
  },
  {
    key: 'home',
    title: '回家之后',
    subtitle: '门一关，你才像自己',
    questionIndexes: [14, 15, 16, 17, 18, 19],
  },
];

/** 静态档位"心里话"模板（AI 失败兜底用） */
export const MALE_FALLBACK_BY_SCORE: Record<number, string> = {
  0: '这一格还稳，先守住它，别让别的事来抢电。',
  1: '有点苗头了，是身体在小声提醒。今晚少做一件不重要的事。',
  2: '这块在掉电了。不是矫情，是真到了该调的点。',
  3: '这块已经在亮红灯了。先别再压，给自己一个下午的喘息。',
};

/** 7 天脚本：每个维度 1 套，最弱维度匹配 */
export interface DayScript {
  day: number;
  title: string;
  morning: string;
  noon: string;
  evening: string;
  reassure: string;
}

const COMMON_REASSURE = '没做到也行。这 7 天不是打卡，是让你知道：原来 5 分钟就能改一点东西。';

export const MALE_SEVEN_DAYS: Record<string, DayScript[]> = {
  energy: [
    { day: 1, title: '先别再透支',     morning: '早上别看工作群，先喝一杯水',          noon: '中午闭眼 10 分钟，不看手机',         evening: '今天哪一刻最没劲？写一行',        reassure: COMMON_REASSURE },
    { day: 2, title: '让身体先说话',   morning: '起床后伸 3 个懒腰',                    noon: '下午 3 点起身走 200 步',              evening: '几点真正放下手机？',              reassure: COMMON_REASSURE },
    { day: 3, title: '补一点电',       morning: '早餐加 1 个鸡蛋',                      noon: '午饭后晒 5 分钟太阳',                 evening: '今晚比昨晚早 15 分钟躺下',        reassure: COMMON_REASSURE },
    { day: 4, title: '拒掉一件事',     morning: '今天少回一个不重要的群',               noon: '拒掉 1 个可去可不去的饭局',           evening: '今天扔掉了什么？',                reassure: COMMON_REASSURE },
    { day: 5, title: '动一下',         morning: '不坐电梯，爬两层',                     noon: '走路去吃午饭',                        evening: '睡前拉伸 3 分钟',                 reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人知道',   morning: '跟伴侣说一句"我最近在调整"',          noon: '给一个老朋友发条消息',                evening: '谁今天让你松了一下？',            reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '重新感受一次电量',                     noon: '看 7 天前的自己',                     evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
  sleep: [
    { day: 1, title: '关一盏灯',       morning: '醒来不立刻看手机',                     noon: '下午之后不喝咖啡',                    evening: '睡前 30 分钟把手机放客厅',        reassure: COMMON_REASSURE },
    { day: 2, title: '让脑子降速',     morning: '起床先深呼吸 5 次',                    noon: '午休不超过 25 分钟',                  evening: '睡前写 3 件今天处理完的事',       reassure: COMMON_REASSURE },
    { day: 3, title: '让身体先困',     morning: '早餐别空胃喝咖啡',                     noon: '午后散步 10 分钟',                    evening: '睡前热水冲脚 5 分钟',             reassure: COMMON_REASSURE },
    { day: 4, title: '不再加班想事',   morning: '把今天 3 件最重要的写下来',            noon: '完成一件就划掉',                      evening: '没做完的，写到明天清单里再睡',    reassure: COMMON_REASSURE },
    { day: 5, title: '给睡眠让路',     morning: '比平时早起 10 分钟',                   noon: '不安排晚饭后的会',                    evening: '比昨晚早 20 分钟躺下',            reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人知道',   morning: '告诉伴侣"今晚早点睡"',                noon: '把睡前 1 小时空出来',                 evening: '醒来记一下：今天醒得轻不轻？',    reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '看 7 天的睡眠变化',                    noon: '决定要不要把节奏稳下来',              evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
  stress: [
    { day: 1, title: '让阀门松一格',   morning: '早上做 4-7-8 呼吸 1 次',               noon: '中午 5 分钟不说话',                   evening: '今天最紧那一刻，是几点？',        reassure: COMMON_REASSURE },
    { day: 2, title: '清缓存',         morning: '把今天三件事写在纸上',                 noon: '只盯一件做完',                        evening: '写 3 行"今天扔掉了什么"',         reassure: COMMON_REASSURE },
    { day: 3, title: '让身体出口',     morning: '伸 3 个懒腰',                          noon: '下午起身走 200 步',                   evening: '睡前拉伸肩颈 3 分钟',             reassure: COMMON_REASSURE },
    { day: 4, title: '少接一根弦',     morning: '今天不秒回工作消息',                   noon: '拒掉 1 件可推的事',                   evening: '哪件事让你放下来了？',            reassure: COMMON_REASSURE },
    { day: 5, title: '让脑子歇半天',   morning: '不开早会就别开',                       noon: '吃饭时不刷手机',                      evening: '睡前 10 分钟不想任何事',          reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人知道',   morning: '跟一个信任的人说一句"我最近紧"',      noon: '不解释、不补救',                      evening: '说完是什么感觉？',                reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '看这 7 天的紧绷度',                    noon: '决定下一步怎么走',                    evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
  confidence: [
    { day: 1, title: '别再硬撑',       morning: '今天哪个场合最没把握？写下来',         noon: '提前演练 5 分钟',                     evening: '今天有哪一刻你撑住了？',          reassure: COMMON_REASSURE },
    { day: 2, title: '把身体调到位',   morning: '早上深呼吸 5 次',                      noon: '关键场合前 4-7-8 呼吸 1 轮',          evening: '今天身体最稳那一刻在哪？',        reassure: COMMON_REASSURE },
    { day: 3, title: '允许不完美',     morning: '今天只要做到 70 分',                   noon: '出错了不复盘超过 5 分钟',             evening: '今天放过自己一次了吗？',          reassure: COMMON_REASSURE },
    { day: 4, title: '挑一个场景赢',   morning: '挑一个小场合好好准备',                 noon: '执行时不分心',                        evening: '哪一刻你觉得自己回来了？',        reassure: COMMON_REASSURE },
    { day: 5, title: '别把状态藏着',   morning: '告诉一个人"我今天有点紧"',            noon: '说完继续做',                          evening: '说出来后是不是松了一点？',        reassure: COMMON_REASSURE },
    { day: 6, title: '让一个人看见',   morning: '把今天的进展告诉伴侣',                 noon: '让一位老友给你打打气',                evening: '谁今天让你更稳了？',              reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '看 7 天前的不安',                      noon: '看现在的自己',                        evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
  relationship: [
    { day: 1, title: '先回家一次',     morning: '出门前跟家人说一句话',                 noon: '回个伴侣的消息别敷衍',                evening: '今晚到家先说"我回来了"',          reassure: COMMON_REASSURE },
    { day: 2, title: '少装一会',       morning: '今天不刻意装坚强',                     noon: '可以说"我有点累"',                    evening: '今天哪句话本来想说没说？',        reassure: COMMON_REASSURE },
    { day: 3, title: '听一次',         morning: '让家人先讲今天',                       noon: '不打断',                              evening: 'Ta 今天最在意什么？',             reassure: COMMON_REASSURE },
    { day: 4, title: '陪一个细节',     morning: '今天给一个小小的关心',                 noon: '比如倒水/夹菜/发个消息',              evening: '对方笑了吗？',                    reassure: COMMON_REASSURE },
    { day: 5, title: '让自己真实',     morning: '不刻意为家里硬撑',                     noon: '让伴侣知道你今天的状态',              evening: '说完关系松了一点没？',            reassure: COMMON_REASSURE },
    { day: 6, title: '一起做一件事',   morning: '今晚和家人一起做 1 件事',              noon: '不带手机',                            evening: '哪个瞬间让你觉得"还在"？',        reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '回看 7 天的家里温度',                  noon: '决定要不要把节奏稳下来',              evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
  recovery: [
    { day: 1, title: '允许自己掉',     morning: '今天先承认"我有点掉了"',              noon: '不强行硬扛',                          evening: '今天哪个瞬间最想躺一会？',        reassure: COMMON_REASSURE },
    { day: 2, title: '设一个恢复窗',   morning: '中午留 25 分钟什么都不做',             noon: '不看手机不开会',                      evening: '休完是不是有点回来？',            reassure: COMMON_REASSURE },
    { day: 3, title: '小动作回血',     morning: '伸 3 个懒腰',                          noon: '下午散步 200 步',                     evening: '睡前拉伸 3 分钟',                 reassure: COMMON_REASSURE },
    { day: 4, title: '减一件透支事',   morning: '今天放下 1 件可不做的事',              noon: '别再加新任务',                        evening: '今天放下了什么？',                reassure: COMMON_REASSURE },
    { day: 5, title: '让自己被看见',   morning: '告诉一个人"我在调整"',                noon: '不解释',                              evening: '对方怎么回你的？',                reassure: COMMON_REASSURE },
    { day: 6, title: '回到节奏',       morning: '挑回一件你以前喜欢的小事',             noon: '做 10 分钟',                          evening: '今天回来了多少？',                reassure: COMMON_REASSURE },
    { day: 7, title: '第 8 天去哪',    morning: '回看这 7 天',                          noon: '看现在的自己',                        evening: '扫末页二维码，找顾问报名训练营',  reassure: COMMON_REASSURE },
  ],
};

/** P8 训练营卡片 */
export const MALE_CAMP_INVITE = {
  campName: '7 天有劲训练营',
  intro: '7 天能让你知道电量怎么回来。但一个人调，调到第 14 天就会塌。',
  values: [
    '每天 15 分钟教练带练，不耽误工作',
    '20 人小群，同频男人互相托底',
    '早晚 2 个动作 · 1 张电量记录卡',
    '第 7 天 1v1 状态复盘 + 下阶段建议',
  ],
  whyNotAlone: '一个人扛得住一阵，扛不住一年。给自己一个不用一个人扛的机会。',
  ctaHint: '扫码加顾问 · 报名领取早鸟价',
};
