/**
 * 教练语音工坊 - 跟进语音模板（V7）
 *
 * 7 模板 × 2 钩子 = 14 个语音变体
 * - 男 3：对齐【男人有劲】测评三档（满电/半电/低电）
 * - 女 4：对齐【情绪健康】测评四类型（耗竭/紧绷/压抑/拖延）
 * - 每个模板内置「直推 ¥399 训练营」「进群培育」两个第④段
 *
 * 四段式：① 共情锚定 → ② 新增洞察 → ③ 微行动钩子 → ④ 转化钩子
 */

export type CoachVoiceTemplateKey =
  | 'male_full' | 'male_half' | 'male_low'
  | 'female_exhaustion' | 'female_tension' | 'female_suppression' | 'female_avoidance';

export type HookType = 'direct399' | 'communityNurture';

export interface CoachVoiceTemplate {
  key: CoachVoiceTemplateKey;
  gender: 'male' | 'female';
  emoji: string;
  label: string;
  tagline: string;
  sourceAssessment: string;
  sourceAssessmentLabel: string;
  /** 完整脚本，按钩子类型返回不同尾段 */
  buildScript: (opts: { nickname?: string; coachName?: string; hookType: HookType }) => string;
}

const _n = (nickname?: string, fallback = '兄弟') => nickname?.trim() || fallback;
const _coach = (name?: string) => name?.trim() || '戴西';

const MALE_CAMP = '7 天有劲训练营';
const FEMALE_CAMP = '7 天有劲训练营';

// ========== 男性 3 个：对齐【男人有劲】三档 ==========

const MALE_TEMPLATES: CoachVoiceTemplate[] = [
  {
    key: 'male_full',
    gender: 'male',
    emoji: '⚡',
    label: '满电状态',
    tagline: '状态在线，别松懈',
    sourceAssessment: 'male_midlife_vitality',
    sourceAssessmentLabel: '男人有劲 · 满电（≥80）',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname);
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `${n}，你这个状态正适合做一次系统校准。我们有个「${MALE_CAMP}」，专门给满电期的兄弟做的——${c}教练带，每天 1 个 5 分钟动作 + 1 次群里复盘，帮你把好状态稳成习惯。有意向我把详情发你，这期还剩几个名额。`
        : `${n}，我们有个「有劲兄弟营」，里面都是状态在线的同龄人，每天${c}教练扔 1 段语音 + 1 个小练习，相互督促保持节奏。要进群我把入口发你。`;
      return [
        `${n}，我看了你的测评——满电状态，挺难得的。这个分数说明你最近的节奏、睡眠、压力调节都还算扛得住。`,
        `给你说个我们带过 800 多个中年男的观察：满电的兄弟最容易栽在一个地方——以为"现在没事就一直没事"，然后突然某个项目压上来，3 周从满电掉到半电。真正的高手不是状态好，是知道什么时候该校准。`,
        `今晚做一件事：拿出手机记事本，写下"本周最让我满电的 3 件事 + 最容易让我掉电的 1 件事"。这是给自己留的预警雷达。`,
        tail,
      ].join('\n\n');
    },
  },
  {
    key: 'male_half',
    gender: 'male',
    emoji: '🔋',
    label: '半电状态',
    tagline: '不是出事，是该微调了',
    sourceAssessment: 'male_midlife_vitality',
    sourceAssessmentLabel: '男人有劲 · 半电（50-79）',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname);
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `我们有个「${MALE_CAMP}」，专门给半电期的兄弟做的——${c}教练带，每天 1 个 5 分钟动作 + 1 次群里复盘。我看了下你测评里最弱的几项，这个营基本就是给你这种状态量身定的。有意向我把详情发你，名额每期限 30 人，这期还剩 8 个。`
        : `我们有个「半电期互助群」，里面都是和你状态相近的兄弟——每天${c}教练扔 1 个 5 分钟练习 + 1 段语音点评，群里也有人定期晒自己的恢复曲线。进来先白嫖 7 天看看，觉得有用我们再聊下一步。要进群我把入口发你。`;
      return [
        `${n}，我看了你的状态——半电，不是出事，但你心里其实知道，这两周开始有点不一样了。`,
        `我们带过 800 多个中年男的观察：真正掉到低电的，95% 都是从半电硬扛 3-4 周拖下去的。不是状态突然崩，是自己以为"还能撑"。半电期是唯一一个能用小成本扳回来的窗口，错过这 21 天，恢复成本翻 4 倍。`,
        `今晚做一件事：睡前把手机扔客厅，留 15 分钟什么都不干。不是冥想不是阅读，就是发呆。70% 的兄弟反馈第一晚睡眠深度就回来了。`,
        tail,
      ].join('\n\n');
    },
  },
  {
    key: 'male_low',
    gender: 'male',
    emoji: '🪫',
    label: '低电预警',
    tagline: '别一个人硬扛',
    sourceAssessment: 'male_midlife_vitality',
    sourceAssessmentLabel: '男人有劲 · 低电（<50）',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname);
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `低电状态光靠自己很难翻盘，硬扛只会越扛越深。我们有个「${MALE_CAMP}」，${c}教练亲自带——前 3 天专门做能量回收，后 4 天再启动节奏。低电进来的兄弟，做完一期基本能拉回半电以上。有意向我把详情发你。`
        : `${n}，低电不是你一个人的问题。我们有个「低电恢复互助群」，里面都是同样状态的兄弟，${c}教练每周亲自带 2-3 次语音复盘。先进来感受一下，不用立刻做什么决定。要进群我把入口发你。`;
      return [
        `${n}，我看了你的测评——低电预警。说实话，这个分数让我有点担心你。你最近撑得太久了。`,
        `我们带过 800 多个中年男的观察：低电状态最危险的不是身体，是判断力会跟着掉——你会开始觉得"忍忍就过去了""不用麻烦别人"。但低电期硬扛 4 周以上，70% 会直接进入睡眠紊乱或情绪崩溃。这不是恐吓，是数据。`,
        `今晚做一件事：什么都别想，就 8 点之前吃完饭，10 点之前躺下。哪怕睡不着，让身体先关机。今晚这一觉，是最便宜的回血。`,
        tail,
      ].join('\n\n');
    },
  },
];

// ========== 女性 4 个：对齐【情绪健康】4 类型 ==========

const FEMALE_TEMPLATES: CoachVoiceTemplate[] = [
  {
    key: 'female_exhaustion',
    gender: 'female',
    emoji: '🔋',
    label: '能量耗竭型',
    tagline: '长期在撑',
    sourceAssessment: 'emotion_health',
    sourceAssessmentLabel: '情绪健康 · 能量耗竭型',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname, '姐妹');
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `我们有个「${FEMALE_CAMP}」，是专门给耗竭型姐姐做的——每天 1 个主体感小练习 + ${c}老师群内带读 + 1 次直播复盘。你这个状态做完一期至少能恢复 30%-50%，要不要我把详情发你看看？`
        : `${n}，我们有个「耗竭型姐姐互助小院」，里面都是和你一样长期在撑的姐妹——${c}老师每周扔 2-3 段语音陪伴 + 群友互相打气。先进来感受 1 周，不合适你随时退。要不我把进群入口发你？`;
      return [
        `${n}，看到你是能量耗竭型——长期在撑，不是你不行，是你已经太久没被人接住了。`,
        `一个观察：耗竭型的姐姐 80% 会卡在一个误区——以为"睡饱了就能恢复"，结果越睡越累。真正的恢复不是补睡眠，是补"主体感"——重新感觉到"我是为自己活，不是为别人活"。这个一周比补 10 小时觉管用。`,
        `今天做一件 5 分钟的小事，纯粹只为自己：认真喝一杯茶、或者买一支口红。不为家人不为孩子不为工作。做完心里说一句"这是我给自己的"。`,
        tail,
      ].join('\n\n');
    },
  },
  {
    key: 'female_tension',
    gender: 'female',
    emoji: '🎯',
    label: '高度紧绷型',
    tagline: '一直在顶',
    sourceAssessment: 'emotion_health',
    sourceAssessmentLabel: '情绪健康 · 高度紧绷型',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname, '姐妹');
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `我们有个「${FEMALE_CAMP}」，特别适合紧绷型的姐姐——${c}老师带 7 天放下控制的微实验，每天 1 个 5 分钟动作 + 群内复盘。做完一期，大脑警报系统会真正关下来。有意向我把详情发你。`
        : `${n}，我们有个「紧绷型互助小院」，里面都是和你一样高要求高自律的姐姐。${c}老师每周分享 2-3 个"允许不完美"的小实验。进来先感受，不合适随时退。要进群我把入口发你？`;
      return [
        `${n}，看到你是高度紧绷型——一直在顶，你对自己要求很高，但也几乎不给自己犯错的空间。`,
        `一个反直觉的观察：紧绷型的姐姐 70% 都以为"放松会让事情失控"，但真实数据是——长期紧绷的人犯错率比适度松弛的人高 40%，因为大脑警报系统一直开着，反而看不清细节。控制感不是来自一直绷着，是来自"我知道什么时候可以放"。`,
        `今晚做一件事：选一件不那么重要的事，故意只做到 70 分。比如发个不那么完美的朋友圈，或者让孩子作业写得糙一点。做完观察一下——世界没塌，你也没死，但你身体松了。`,
        tail,
      ].join('\n\n');
    },
  },
  {
    key: 'female_suppression',
    gender: 'female',
    emoji: '🤐',
    label: '情绪压抑型',
    tagline: '习惯忍',
    sourceAssessment: 'emotion_health',
    sourceAssessmentLabel: '情绪健康 · 情绪压抑型',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname, '姐妹');
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `我们有个「${FEMALE_CAMP}」，特别适合压抑型的姐姐——${c}老师带 7 天情绪命名 + 安全表达练习，群里都是同类人，不用怕被评价。做完一期，你会发现"说出来"原来这么轻。有意向我把详情发你。`
        : `${n}，我们有个「压抑型姐姐安心小院」，里面的姐妹都是习惯把情绪自己消化的。${c}老师每周陪 2-3 次，群里说什么都不会被评判。先进来听听别人的声音，不用立刻说话。要进群我把入口发你？`;
      return [
        `${n}，看到你是情绪压抑型——习惯忍，你很少给自己添麻烦，却常常在心里一个人消化所有情绪。`,
        `一个观察：压抑型的姐姐 65% 会出现身体症状——头痛、胃痛、莫名疲劳，但去医院查不出问题。这不是矫情，是被压下去的情绪没消失，只是换了出口。真正的释放不是哭一场，是学会给情绪命名——光是说出"我现在很委屈"，皮质醇水平就会降 27%。`,
        `今晚做一件事：用这句话补全——"今天 ___ 发生时，我其实很 ___"。可以写在备忘录里，不用给任何人看。说出来，是释放的第一步。`,
        tail,
      ].join('\n\n');
    },
  },
  {
    key: 'female_avoidance',
    gender: 'female',
    emoji: '🐢',
    label: '逃避延迟型',
    tagline: '卡在开始',
    sourceAssessment: 'emotion_health',
    sourceAssessmentLabel: '情绪健康 · 逃避延迟型',
    buildScript: ({ nickname, coachName, hookType }) => {
      const n = _n(nickname, '姐妹');
      const c = _coach(coachName);
      const tail = hookType === 'direct399'
        ? `我们有个「${FEMALE_CAMP}」，特别适合拖延型的姐姐——${c}老师带 7 天"5 分钟启动法"，每天就一个微动作，做完打卡群里互相鼓励。做完一期，你会重新相信"我能开始"。有意向我把详情发你。`
        : `${n}，我们有个「拖延型姐姐启动小院」，里面都是和你一样卡在开始的人。${c}老师每天扔 1 个 5 分钟微任务，做了就晒，没做也没人骂你。先进来感受这种"不被催"的氛围。要进群我把入口发你？`;
      return [
        `${n}，看到你是逃避延迟型——卡在开始，你不是没能力，而是每次一想到要开始就先被情绪拖住了。`,
        `一个反直觉的观察：拖延型的姐姐 80% 都误以为"我是懒"，其实你的大脑把"开始"误判成了威胁。拖延不是懒，是情绪系统在保护你不受伤害。骂自己越狠，大脑警报越响，越启动不了。真正能破解的方法是——把任务拆到极小，让大脑发现"开始原来不可怕"。`,
        `今天做一件事：选一件你一直拖着的事，现在只做 5 分钟内能完成的最小步骤。比如打开文件、写一句话、发一条信息。完成后，告诉自己"我已经开始了"。这一句话比任何鸡汤都管用。`,
        tail,
      ].join('\n\n');
    },
  },
];

// ========== 导出 ==========

export const COACH_VOICE_TEMPLATES: CoachVoiceTemplate[] = [
  ...MALE_TEMPLATES,
  ...FEMALE_TEMPLATES,
];

export const getTemplatesByGender = (gender: 'male' | 'female') =>
  COACH_VOICE_TEMPLATES.filter(t => t.gender === gender);

export const getTemplateByKey = (key: CoachVoiceTemplateKey) =>
  COACH_VOICE_TEMPLATES.find(t => t.key === key);

export const HOOK_TYPE_LABELS: Record<HookType, { emoji: string; label: string; desc: string }> = {
  direct399: { emoji: '🔥', label: '直推 ¥399 训练营', desc: '用户温度高 / 已问价 / 测评偏低' },
  communityNurture: { emoji: '🌱', label: '进群培育', desc: '用户温度还不够 / 第一次接触' },
};
