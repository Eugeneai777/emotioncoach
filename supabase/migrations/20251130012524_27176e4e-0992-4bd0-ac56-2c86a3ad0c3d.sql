-- Fix scenarios data with correct coach_key values
UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "daily_feeling",
    "emoji": "🌤️",
    "title": "今天的感受",
    "prompt": "今天我感到有些焦虑，想和你聊聊"
  },
  {
    "id": "relationship",
    "emoji": "💝",
    "title": "人际关系",
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
  }
]'::jsonb,
    enable_scenarios = true
WHERE coach_key = 'emotion';

UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "child_tantrum",
    "emoji": "😤",
    "title": "孩子发脾气",
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
    "title": "兄弟姐妹争吵",
    "prompt": "两个孩子总是吵架，该如何调解"
  },
  {
    "id": "adolescent_communication",
    "emoji": "🌪️",
    "title": "青春期沟通",
    "prompt": "孩子进入青春期后，很难沟通"
  }
]'::jsonb,
    enable_scenarios = true
WHERE coach_key = 'parent';

UPDATE coach_templates 
SET scenarios = '[
  {
    "id": "workplace_conflict",
    "emoji": "💼",
    "title": "职场冲突",
    "prompt": "和同事在工作上有分歧，想寻求建议"
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
  }
]'::jsonb,
    enable_scenarios = true
WHERE coach_key = 'communication';