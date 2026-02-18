// 竞争力维度类型
export type CompetitivenessCategory = "career" | "brand" | "resilience" | "finance" | "relationship";

export interface CompetitivenessQuestion {
  id: number;
  category: CompetitivenessCategory;
  text: string;
  /** true = 高分代表积极（反向计分），false = 高分代表消极（正向计分） */
  reversed?: boolean;
}

export const scoreLabels = [
  { value: 1, label: "完全不是我" },
  { value: 2, label: "偶尔这样" },
  { value: 3, label: "有时会" },
  { value: 4, label: "经常这样" },
  { value: 5, label: "太像我了" },
];

export const categoryInfo: Record<CompetitivenessCategory, {
  name: string;
  emoji: string;
  color: string;
  description: string;
}> = {
  career: {
    name: "职场生命力",
    emoji: "💼",
    color: "#6366f1",
    description: "职场信心、跳槽勇气、谈薪能力、持续学习力",
  },
  brand: {
    name: "个人品牌力",
    emoji: "🌟",
    color: "#f59e0b",
    description: "表达能力、专业影响力、社交资产",
  },
  resilience: {
    name: "情绪韧性",
    emoji: "🛡️",
    color: "#10b981",
    description: "抗压能力、自我修复、边界感",
  },
  finance: {
    name: "财务掌控力",
    emoji: "💰",
    color: "#ef4444",
    description: "理财认知、消费独立、被动收入意识",
  },
  relationship: {
    name: "关系经营力",
    emoji: "🤝",
    color: "#8b5cf6",
    description: "家庭平衡、社交圈质量、求助能力",
  },
};

// 题目设计：高分(4-5)代表消极/焦虑反应，低分代表自信/积极
// reversed=true 的题目则相反（高分=积极）
export const questions: CompetitivenessQuestion[] = [
  // === 职场生命力 (career) ===
  { id: 1, category: "career", text: "公司裁员名单里出现了和你同龄的同事，你的第一反应是'下一个就是自己'" },
  { id: 2, category: "career", text: "面试官问'你35岁了还换工作？'，你会心虚到说不出话" },
  { id: 3, category: "career", text: "想到要和95后竞争同一个岗位，你觉得自己毫无胜算" },
  { id: 4, category: "career", text: "领导暗示你的岗位可能被AI取代，你完全不知道该怎么办" },
  { id: 5, category: "career", text: "最近一年你主动学习新技能或考证的次数不超过2次" },
  { id: 6, category: "career", text: "谈加薪时你会紧张到放弃，宁可等公司主动调薪" },

  // === 个人品牌力 (brand) ===
  { id: 7, category: "brand", text: "有人邀请你在行业活动上做分享，你直接拒绝，觉得自己不够格" },
  { id: 8, category: "brand", text: "你在朋友圈几乎不发专业观点，怕说错了被嘲笑" },
  { id: 9, category: "brand", text: "同事升职做了你曾做的岗位，你觉得是因为自己不够好" },
  { id: 10, category: "brand", text: "在社交场合自我介绍时，你很难用一句话说清自己的价值" },
  { id: 11, category: "brand", text: "你认为'酒香不怕巷子深'，默默做事总会被看到" },
  { id: 12, category: "brand", text: "你没有可以随时展示的个人作品集或成就清单" },

  // === 情绪韧性 (resilience) ===
  { id: 13, category: "resilience", text: "被领导当众批评后，你需要超过3天才能恢复状态" },
  { id: 14, category: "resilience", text: "遇到不合理的要求，你习惯忍气吞声而不是表达边界" },
  { id: 15, category: "resilience", text: "家人和工作同时需要你时，你会陷入深深的内疚和自责" },
  { id: 16, category: "resilience", text: "别人一句无心的话，你会反复琢磨好几天" },
  { id: 17, category: "resilience", text: "你很难对人说'不'，即使这件事让你很为难" },

  // === 财务掌控力 (finance) ===
  { id: 18, category: "finance", text: "如果突然失业，你的存款支撑不了6个月的生活" },
  { id: 19, category: "finance", text: "你的收入来源只有一份工资，没有任何被动收入" },
  { id: 20, category: "finance", text: "你不清楚自己每月的具体支出分布" },
  { id: 21, category: "finance", text: "你把所有积蓄都放在银行活期或定期，从没尝试过其他理财方式" },
  { id: 22, category: "finance", text: "大额消费时你需要征得伴侣同意，完全没有自己的'自由基金'" },

  // === 关系经营力 (relationship) ===
  { id: 23, category: "relationship", text: "遇到困难时，你想不出3个可以求助的朋友" },
  { id: 24, category: "relationship", text: "你已经很久没有主动约朋友见面或深入交流了" },
  { id: 25, category: "relationship", text: "你觉得求助别人是一种'麻烦人家'的行为" },
  { id: 26, category: "relationship", text: "在家庭中你承担了大部分情绪劳动，但很少有人关心你的感受" },
  { id: 27, category: "relationship", text: "你的社交圈基本没变过，很少认识新领域的人" },
];

// 竞争力类型
export type CompetitivenessLevel = "dormant" | "awakening" | "blooming" | "leading";

export const levelInfo: Record<CompetitivenessLevel, {
  name: string;
  emoji: string;
  color: string;
  gradient: string;
  description: string;
  encouragement: string;
}> = {
  dormant: {
    name: "蛰伏期",
    emoji: "🌱",
    color: "#94a3b8",
    gradient: "from-slate-400 to-slate-500",
    description: "你正处于力量积蓄的阶段，内在的潜力还未被完全唤醒",
    encouragement: "每一颗种子都在等待属于它的春天，你的绽放只是时间问题",
  },
  awakening: {
    name: "觉醒期",
    emoji: "🌿",
    color: "#22c55e",
    gradient: "from-emerald-400 to-green-500",
    description: "你已经意识到了自己的力量，正在突破的路上",
    encouragement: "觉醒是最难的一步，你已经迈出来了",
  },
  blooming: {
    name: "绽放期",
    emoji: "🌸",
    color: "#ec4899",
    gradient: "from-pink-400 to-rose-500",
    description: "你在多个维度展现出了强劲的竞争力",
    encouragement: "你正在用自己的方式重新定义35+的可能性",
  },
  leading: {
    name: "引领期",
    emoji: "👑",
    color: "#f59e0b",
    gradient: "from-amber-400 to-yellow-500",
    description: "你是同龄人中的标杆，在各维度都展现出卓越能力",
    encouragement: "你不只是在竞争，你在引领一种全新的人生范式",
  },
};

export interface CompetitivenessResult {
  totalScore: number; // 0-100
  level: CompetitivenessLevel;
  categoryScores: Record<CompetitivenessCategory, number>; // 每个维度 0-100
  strongestCategory: CompetitivenessCategory;
  weakestCategory: CompetitivenessCategory;
}

// 判断是否触发AI追问（高分=消极反应=值得追问）
export function shouldAskFollowUp(score: number, questionIndex: number, existingFollowUps: number): boolean {
  // 最多追问3次
  if (existingFollowUps >= 3) return false;
  // 得分4-5（消极倾向明显）时触发
  if (score >= 4) {
    // 每个维度最多追问1次，间隔至少3题
    return questionIndex % 5 === 0 || questionIndex % 7 === 0;
  }
  return false;
}

export function getQuestionCategory(questionId: number): string {
  const q = questions.find(q => q.id === questionId);
  return q?.category || "general";
}

export interface FollowUpAnswer {
  questionId: number;
  questionText: string;
  selectedOption: string;
  timestamp: Date;
}

export function calculateResult(answers: Record<number, number>): CompetitivenessResult {
  const categories: CompetitivenessCategory[] = ["career", "brand", "resilience", "finance", "relationship"];
  
  const categoryScores: Record<CompetitivenessCategory, number> = {} as any;
  
  for (const cat of categories) {
    const catQuestions = questions.filter(q => q.category === cat);
    const maxScore = catQuestions.length * 5;
    let rawScore = 0;
    
    for (const q of catQuestions) {
      const answer = answers[q.id] || 3;
      // 高分=消极，所以反转: 竞争力 = 6 - answer
      rawScore += (6 - answer);
    }
    
    categoryScores[cat] = Math.round((rawScore / maxScore) * 100);
  }
  
  // 总分 = 各维度平均
  const totalScore = Math.round(
    categories.reduce((sum, cat) => sum + categoryScores[cat], 0) / categories.length
  );
  
  // 判断竞争力等级
  let level: CompetitivenessLevel;
  if (totalScore <= 40) level = "dormant";
  else if (totalScore <= 60) level = "awakening";
  else if (totalScore <= 80) level = "blooming";
  else level = "leading";
  
  // 最强和最弱维度
  const sorted = categories.sort((a, b) => categoryScores[b] - categoryScores[a]);
  
  return {
    totalScore,
    level,
    categoryScores,
    strongestCategory: sorted[0],
    weakestCategory: sorted[sorted.length - 1],
  };
}
