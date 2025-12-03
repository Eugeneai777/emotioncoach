// 32条认知提醒内容库
// 按4个心理阶段组织，每阶段8条，但界面不显示阶段名称
// 使用第一人称"我"进行自我对话，增强自我认同感

// 阶段配置 - 用于颜色映射和视觉反馈
export const STAGE_CONFIG = [
  { 
    name: "稳定", 
    englishName: "Stabilize",
    colorClass: "stroke-teal-500",
    borderClass: "border-teal-300",
    bgClass: "bg-teal-50",
    textClass: "text-teal-700"
  },
  { 
    name: "去灾难化", 
    englishName: "De-catastrophize",
    colorClass: "stroke-cyan-500",
    borderClass: "border-cyan-300",
    bgClass: "bg-cyan-50",
    textClass: "text-cyan-700"
  },
  { 
    name: "恢复掌控", 
    englishName: "Regain Control",
    colorClass: "stroke-blue-500",
    borderClass: "border-blue-300",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700"
  },
  { 
    name: "重建信念", 
    englishName: "Rebuild Inner Safety",
    colorClass: "stroke-indigo-500",
    borderClass: "border-indigo-300",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700"
  },
];

// 获取当前提醒所属的阶段索引 (0-3)
export const getStageIndex = (reminderIndex: number): number => {
  return Math.floor(reminderIndex / 8);
};

// 获取当前阶段的配置
export const getStageConfig = (reminderIndex: number) => {
  const stageIndex = getStageIndex(reminderIndex);
  return STAGE_CONFIG[stageIndex] || STAGE_CONFIG[0];
};

export const cognitiveReminders = [
  // 阶段 1（1–8）— 稳定生理反应 Stabilize
  "我的身体在误报危险，但我现在是安全的。",
  "情绪的强度不会持续，它会慢慢降下来。",
  "心跳快不代表危险，只是身体在保护我。",
  "恐慌的感觉很强烈，但它不是事实。",
  "我正在经历一股波浪，而波浪会过去。",
  "我不需要马上平静，只需要比刚才慢一点。",
  "每一次呼吸都在带我回到稳定。",
  "我的身体从来没有让我停在恐慌里，它总会带我走出来。",
  
  // 阶段 2（9–16）— 去灾难化 De-catastrophize
  "大脑正在预测最坏情况，但那不是现实。",
  "我感到害怕，不代表事情真的会发生。",
  "恐慌是反应过度，不是我做错了什么。",
  "我之前每次都挺过来了，这次也一样。",
  "我不需要面对整件事，只需要处理这一刻。",
  "身体的紧绷不是危险，是能量被放大了。",
  "这只是自动反应，不是失控。",
  "强烈不等于危险，只是感觉在放大。",
  
  // 阶段 3（17–24）— 恢复掌控感 Regain Control
  "我能选择现在要专注的下一件小事。",
  "情绪没有抓住我，我正在找回应对的方法。",
  "恐慌可能在敲门，但我不一定要让它进来。",
  "呼吸的节奏，是我可以掌控的。",
  "我正在从「不行」转向「我可以先这样做」。",
  "当我把注意力放到一个点上，我就重新掌控了。",
  "我的能力比我现在感受到的更大。",
  "我已经一次次从恐慌走出来，这证明我的实力。",
  
  // 阶段 4（25–32）— 建立新的信念 Rebuild Inner Safety
  "我已经证明恐慌不能控制我。",
  "我比自己意识到的更坚韧。",
  "恐惧来得快，但我的恢复力更快。",
  "我能感受到恐慌，但不需要跟着它走。",
  "我正在学习一种新的能力：带着不适继续生活。",
  "强烈情绪不能定义我，我正在重新定义它。",
  "我的身体和大脑现在更懂得如何回到稳定。",
  "这阵恐慌会离开我，而我会留下来。",
];

export const REMINDERS_PER_CYCLE = 8;
export const TOTAL_REMINDERS = cognitiveReminders.length;
