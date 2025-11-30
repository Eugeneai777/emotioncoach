-- Update scenarios to 6 items with 4-character titles for emotion coach
UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "daily_feeling",
    "emoji": "🌤️",
    "title": "今天心情",
    "prompt": "今天我感到有些焦虑，想和你聊聊"
  },
  {
    "id": "relationship",
    "emoji": "💝",
    "title": "人际困扰",
    "prompt": "最近和朋友的关系让我有点困扰"
  },
  {
    "id": "work_stress",
    "emoji": "💼",
    "title": "工作压力",
    "prompt": "工作上的压力让我喘不过气"
  },
  {
    "id": "self_growth",
    "emoji": "🌱",
    "title": "自我成长",
    "prompt": "想和你探讨一下我的成长困惑"
  },
  {
    "id": "anxiety",
    "emoji": "😰",
    "title": "焦虑不安",
    "prompt": "最近总是很焦虑，担心很多事情"
  },
  {
    "id": "low_mood",
    "emoji": "😢",
    "title": "心情低落",
    "prompt": "心情很低落，提不起精神做事"
  }
]'::jsonb
WHERE coach_key = 'emotion';

-- Update scenarios to 6 items with 4-character titles for parent coach
UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "child_tantrum",
    "emoji": "😤",
    "title": "情绪爆发",
    "prompt": "孩子今天又发脾气了，我不知道该怎么办"
  },
  {
    "id": "homework_conflict",
    "emoji": "📚",
    "title": "作业冲突",
    "prompt": "每次辅导作业都会吵架，很头疼"
  },
  {
    "id": "sibling_fight",
    "emoji": "👫",
    "title": "手足争吵",
    "prompt": "两个孩子总是吵架，该如何调解"
  },
  {
    "id": "adolescent_communication",
    "emoji": "🌪️",
    "title": "青春沟通",
    "prompt": "孩子进入青春期后，很难沟通"
  },
  {
    "id": "screen_time",
    "emoji": "📱",
    "title": "电子产品",
    "prompt": "孩子沉迷手机/游戏，说了也不听"
  },
  {
    "id": "education_anxiety",
    "emoji": "🎓",
    "title": "教育焦虑",
    "prompt": "担心孩子的学习和未来发展"
  }
]'::jsonb
WHERE coach_key = 'parent';

-- Update scenarios to 6 items with 4-character titles for communication coach
UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "workplace_report",
    "emoji": "💼",
    "title": "职场汇报",
    "prompt": "需要向领导汇报工作，担心表达不清"
  },
  {
    "id": "family_communication",
    "emoji": "🏠",
    "title": "家庭沟通",
    "prompt": "和家人沟通总是不在一个频道"
  },
  {
    "id": "intimate_relationship",
    "emoji": "💑",
    "title": "亲密关系",
    "prompt": "和伴侣的沟通出现了问题"
  },
  {
    "id": "difficult_conversation",
    "emoji": "🗣️",
    "title": "困难对话",
    "prompt": "有个困难的对话需要进行，不知道怎么开口"
  },
  {
    "id": "decline_request",
    "emoji": "❌",
    "title": "拒绝请求",
    "prompt": "有人请我帮忙但没时间，不知道怎么拒绝"
  },
  {
    "id": "express_feelings",
    "emoji": "💬",
    "title": "表达感受",
    "prompt": "想表达我的感受，但不想让对方觉得指责"
  }
]'::jsonb
WHERE coach_key = 'communication';