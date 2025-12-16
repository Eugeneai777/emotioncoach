import { TourStep } from "@/components/PageTour";

export const pageTourConfig: Record<string, TourStep[]> = {
  // 首页/情绪教练
  index: [
    {
      icon: "💚",
      title: "欢迎来到情绪教练",
      description: "这里是你情绪成长的起点，有劲老师将陪伴你探索和理解自己的情绪。",
      details: [
        "通过对话记录和理解你的情绪",
        "四阶段科学方法：觉察→理解→反应→转化",
        "每次对话后生成专属情绪简报"
      ]
    },
    {
      icon: "🎙️",
      title: "语音对话更自然",
      description: "点击麦克风按钮，用语音和有劲老师交流，就像和朋友聊天一样自然。",
      details: [
        "语音识别自动转文字",
        "随时切换文字和语音输入"
      ]
    },
    {
      icon: "📊",
      title: "查看你的情绪日记",
      description: "点击「情绪日记」查看所有对话记录和情绪简报，追踪你的成长轨迹。"
    }
  ],

  // 有劲生活馆
  energy_studio: [
    {
      icon: "✨",
      title: "欢迎来到有劲生活馆",
      description: "这里汇聚了所有帮助你成长的工具和资源，是你的专属能量补给站。"
    },
    {
      icon: "💬",
      title: "教练空间",
      description: "选择适合你的AI教练进行对话，包括情绪教练、亲子教练、沟通教练等。",
      details: [
        "情绪教练：处理情绪困扰",
        "亲子教练：改善亲子关系",
        "沟通教练：提升沟通技巧"
      ]
    },
    {
      icon: "🛠️",
      title: "成长工具",
      description: "各种实用小工具帮你管理情绪和生活，如情绪SOS按钮、呼吸练习、冥想等。"
    },
    {
      icon: "🏕️",
      title: "训练营",
      description: "加入21天结构化训练营，通过每日打卡养成好习惯，获得系统性成长。"
    }
  ],

  // 亲子教练
  parent_coach: [
    {
      icon: "👨‍👩‍👧",
      title: "欢迎使用亲子教练",
      description: "专为父母设计的AI教练，帮助你更好地理解孩子、改善亲子关系。",
      details: [
        "「父母先稳，孩子才愿意走向你」"
      ]
    },
    {
      icon: "📞",
      title: "语音对话更便捷",
      description: "点击语音按钮，像打电话一样和教练对话，边做家务边倾诉都可以。"
    },
    {
      icon: "📋",
      title: "亲子四部曲",
      description: "通过觉察、理解、反应、转化四个阶段，学习科学的亲子沟通方法。"
    },
    {
      icon: "🏕️",
      title: "开启训练营",
      description: "加入亲子教练训练营，每天一次对话，21天建立更亲密的亲子关系。"
    }
  ],

  // 沟通教练
  communication_coach: [
    {
      icon: "💬",
      title: "欢迎使用沟通教练",
      description: "基于卡内基沟通法则，帮你「轻松说出想说的话，让对方愿意听」。"
    },
    {
      icon: "🎯",
      title: "场景化练习",
      description: "选择具体沟通场景进行模拟练习，如职场沟通、家庭对话、朋友交流等。"
    },
    {
      icon: "📝",
      title: "沟通四步法",
      description: "通过「看见→理解→影响→行动」四个步骤，学习有效沟通的技巧。",
      details: [
        "看见：客观描述事实",
        "理解：换位思考对方",
        "影响：表达自己需求",
        "行动：制定具体方案"
      ]
    }
  ],

  // 社区
  community: [
    {
      icon: "🌍",
      title: "欢迎来到有劲社区",
      description: "这里是分享成长故事、获得支持的温暖空间。"
    },
    {
      icon: "📖",
      title: "浏览故事",
      description: "查看其他用户分享的成长故事、情绪日记，你并不孤单。",
      details: [
        "「关注」：你关注的人的动态",
        "「发现」：热门推荐内容",
        "「共鸣」：情绪相似的分享",
        "「故事」：深度成长故事"
      ]
    },
    {
      icon: "✏️",
      title: "分享你的故事",
      description: "点击「分享动态」按钮，记录你的成长瞬间，可以选择匿名发布。"
    }
  ],

  // 感恩日记
  gratitude_journal: [
    {
      icon: "🙏",
      title: "欢迎使用感恩日记",
      description: "每天记录值得感恩的小事，培养积极心态，提升幸福感。"
    },
    {
      icon: "✨",
      title: "七维度幸福模型",
      description: "记录涵盖七个维度：人际关系、成就感、享受、意义、感恩、宁静、成长。"
    },
    {
      icon: "📊",
      title: "AI幸福报告",
      description: "系统会分析你的记录，生成个性化的幸福分析报告，帮你发现生活中的美好。"
    },
    {
      icon: "📈",
      title: "追踪成长",
      description: "查看记录趋势和标签分布，了解自己的幸福来源，发现需要关注的维度。"
    }
  ],

  // 情绪SOS按钮
  emotion_button: [
    {
      icon: "🆘",
      title: "情绪SOS急救按钮",
      description: "当情绪失控时，这里是你的急救站，帮你30秒内稳定情绪。"
    },
    {
      icon: "🎯",
      title: "选择你的情绪",
      description: "9种常见负面情绪：恐慌、担心、负面、恐惧、烦躁、压力、无力、崩溃、失落。"
    },
    {
      icon: "💡",
      title: "288条认知提醒",
      description: "每种情绪都有32条专业认知提醒，基于认知行为疗法，帮你重新看待困境。"
    },
    {
      icon: "🌬️",
      title: "呼吸稳定练习",
      description: "配合呼吸练习，帮助身体从「战斗或逃跑」状态恢复到平静状态。"
    }
  ],

  // 训练营列表
  camp_list: [
    {
      icon: "🏕️",
      title: "欢迎来到训练营",
      description: "这里有各种21天结构化训练课程，帮你养成好习惯、获得系统性成长。"
    },
    {
      icon: "📅",
      title: "21天承诺",
      description: "每个训练营为期21天，每天完成一次教练对话和练习任务。",
      details: [
        "每日对话打卡",
        "阶段性复盘总结",
        "训练营社群支持"
      ]
    },
    {
      icon: "🎁",
      title: "免费训练营",
      description: "部分训练营完全免费，可以先体验再决定是否升级付费内容。"
    }
  ],

  // 套餐
  packages: [
    {
      icon: "💎",
      title: "会员套餐介绍",
      description: "了解不同套餐的权益差异，选择适合你的成长方案。"
    },
    {
      icon: "🆓",
      title: "免费体验",
      description: "新用户可免费体验核心功能，感受AI教练的陪伴价值。"
    },
    {
      icon: "⭐",
      title: "会员权益",
      description: "升级会员解锁更多功能：无限对话、语音通话、训练营、高级分析等。",
      details: [
        "尝鲜会员：50对话点数，适合轻度用户",
        "365会员：1000对话点数，全功能解锁"
      ]
    },
    {
      icon: "🤝",
      title: "成为合伙人",
      description: "如果你认可有劲的价值，可以成为合伙人，分享给更多需要的人。"
    }
  ]
};
