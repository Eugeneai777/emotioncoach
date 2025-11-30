-- Add scenarios column to coach_templates
ALTER TABLE coach_templates 
ADD COLUMN scenarios JSONB DEFAULT '[]'::jsonb;

-- Update existing coaches with scenario data
-- 情绪教练 (emotion-coach)
UPDATE coach_templates 
SET scenarios = '[
  {"id": "mood-swing", "emoji": "🎭", "title": "情绪波动", "prompt": "今天情绪起伏很大，一会儿开心一会儿烦躁..."},
  {"id": "work-stress", "emoji": "💼", "title": "工作压力", "prompt": "工作上遇到了很大的压力，感觉快喘不过气..."},
  {"id": "relationship", "emoji": "👥", "title": "人际困扰", "prompt": "和朋友/同事的关系让我很困扰..."},
  {"id": "anxiety", "emoji": "😰", "title": "焦虑不安", "prompt": "最近总是很焦虑，担心很多事情..."},
  {"id": "sadness", "emoji": "😢", "title": "感到低落", "prompt": "心情很低落，提不起精神做事..."},
  {"id": "anger", "emoji": "😤", "title": "生气愤怒", "prompt": "对某件事/某个人感到很生气..."}
]'::jsonb
WHERE coach_key = 'emotion-coach';

-- 亲子教练 (parent-coach)
UPDATE coach_templates 
SET scenarios = '[
  {"id": "child-tantrum", "emoji": "😭", "title": "情绪爆发", "prompt": "孩子突然大哭大闹，我不知道怎么处理..."},
  {"id": "homework-battle", "emoji": "📚", "title": "作业冲突", "prompt": "每次辅导作业都会吵起来..."},
  {"id": "disobey", "emoji": "🙅", "title": "不听话", "prompt": "孩子总是不听我说的话..."},
  {"id": "screen-time", "emoji": "📱", "title": "电子产品", "prompt": "孩子沉迷手机/游戏，说了也不听..."},
  {"id": "sibling", "emoji": "👫", "title": "兄弟姐妹", "prompt": "两个孩子经常吵架打架..."},
  {"id": "education-anxiety", "emoji": "🎓", "title": "教育焦虑", "prompt": "担心孩子的学习和未来..."}
]'::jsonb
WHERE coach_key = 'parent-coach';

-- 沟通教练 (carnegie-coach)
UPDATE coach_templates 
SET scenarios = '[
  {"id": "work-report", "emoji": "💼", "title": "职场汇报", "prompt": "我需要向领导汇报工作进展，但担心表达不清或被质疑..."},
  {"id": "family-talk", "emoji": "🏠", "title": "家庭沟通", "prompt": "我想和家人沟通我的想法，但担心引起争执..."},
  {"id": "reject-request", "emoji": "❌", "title": "拒绝请求", "prompt": "有人请我帮忙，但我实在没有时间，不知道怎么拒绝..."},
  {"id": "express-feelings", "emoji": "💗", "title": "表达感受", "prompt": "我想表达我的感受，但不想让对方觉得我在指责..."},
  {"id": "team-feedback", "emoji": "👥", "title": "团队反馈", "prompt": "我需要给同事一些建议，但担心影响关系..."},
  {"id": "difficult-conversation", "emoji": "💬", "title": "困难对话", "prompt": "有一个很敏感的话题需要讨论，我不知道从何说起..."}
]'::jsonb
WHERE coach_key = 'carnegie-coach';

-- 生活教练 (life-coach)
UPDATE coach_templates 
SET scenarios = '[
  {"id": "health-concern", "emoji": "💪", "title": "健康问题", "prompt": "最近身体状态不太好，想要改善生活方式..."},
  {"id": "work-life", "emoji": "⚖️", "title": "工作平衡", "prompt": "工作和生活难以平衡，感觉压力很大..."},
  {"id": "sleep-issue", "emoji": "😴", "title": "睡眠困扰", "prompt": "晚上总是睡不好，白天精神不佳..."},
  {"id": "exercise-plan", "emoji": "🏃", "title": "运动计划", "prompt": "想要开始运动，但不知道如何坚持..."},
  {"id": "diet-habits", "emoji": "🥗", "title": "饮食习惯", "prompt": "想要改善饮食习惯，建立更健康的生活方式..."},
  {"id": "time-manage", "emoji": "⏰", "title": "时间管理", "prompt": "总觉得时间不够用，想要提高效率..."}
]'::jsonb
WHERE coach_key = 'life-coach';