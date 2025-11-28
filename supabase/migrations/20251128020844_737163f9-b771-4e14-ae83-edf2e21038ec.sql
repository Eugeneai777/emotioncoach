-- Create camp_templates table for managing different training camps
CREATE TABLE IF NOT EXISTS public.camp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_type TEXT NOT NULL UNIQUE,
  camp_name TEXT NOT NULL,
  camp_subtitle TEXT,
  description TEXT,
  duration_days INTEGER NOT NULL,
  theme_color TEXT DEFAULT 'purple',
  gradient TEXT DEFAULT 'from-purple-500 to-pink-500',
  icon TEXT DEFAULT '📝',
  stages JSONB,
  learning_formats JSONB,
  prerequisites JSONB,
  target_audience JSONB,
  benefits JSONB,
  daily_practice JSONB,
  weekly_activities JSONB,
  research_stats JSONB,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.camp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active camp templates" ON public.camp_templates
  FOR SELECT USING (is_active = true);

-- Insert 21天情绪日记训练营
INSERT INTO public.camp_templates (
  camp_type, camp_name, camp_subtitle, description, duration_days, 
  theme_color, gradient, icon, display_order,
  stages, learning_formats, target_audience, benefits, daily_practice, weekly_activities, research_stats, prerequisites
) VALUES (
  'emotion_journal_21',
  '21天情绪日记训练营',
  'Emotion Journal',
  '每天10分钟，让情绪变成你的力量',
  21,
  'purple',
  'from-purple-500 to-pink-500',
  '📝',
  1,
  '[]'::jsonb,
  '[]'::jsonb,
  '["经常焦虑、压力大的人", "情绪敏感、容易受影响", "脑袋混乱、思绪停不下来", "想提升决策力的人", "想改善人际关系", "想养成好习惯但总失败", "对自我成长有兴趣", "想系统学习情绪管理"]'::jsonb,
  '[]'::jsonb,
  '[{"time": "☀️ 早上", "title": "今日宣言卡", "duration": "1分钟", "content": "AI生成专属宣言，分享建立正向暗示", "gradient": "from-amber-500 to-orange-500"}, {"time": "🌤️ 白天", "title": "记录情绪", "duration": "2-3分钟", "content": "命名情绪、找触发点、看见需求", "gradient": "from-blue-500 to-cyan-500"}, {"time": "🌙 晚上", "title": "情绪复盘", "duration": "6分钟", "content": "今日梳理、洞察、行动、成长故事", "gradient": "from-indigo-600 to-purple-600"}]'::jsonb,
  '[]'::jsonb,
  '[{"label": "焦虑下降", "value": "31%", "gradient": "from-purple-500 to-pink-500"}, {"label": "决策清晰度提升", "value": "40%", "gradient": "from-cyan-500 to-blue-500"}, {"label": "睡眠改善", "value": "28%", "gradient": "from-indigo-500 to-purple-500"}, {"label": "执行力提升", "value": "2.4倍", "gradient": "from-orange-500 to-red-500"}]'::jsonb,
  NULL
);

-- Insert 身份绽放训练营
INSERT INTO public.camp_templates (
  camp_type, camp_name, camp_subtitle, description, duration_days, 
  theme_color, gradient, icon, display_order,
  stages, learning_formats, target_audience, benefits, daily_practice, weekly_activities, research_stats, prerequisites
) VALUES (
  'identity_bloom',
  '身份绽放训练营',
  'Being Yourself',
  '发现真实的自己，活出精彩人生',
  28,
  'blue',
  'from-blue-500 to-cyan-500',
  '🦋',
  2,
  '[{"stage": 1, "title": "我知道我是谁", "duration": "7天", "description": "探索自我身份认知"}, {"stage": 2, "title": "自主生命，自主成长", "duration": "7天", "description": "建立自主性和成长思维"}, {"stage": 3, "title": "突破迷雾，美好呈现", "duration": "7天", "description": "突破限制性信念"}, {"stage": 4, "title": "转化困境，破茧成蝶", "duration": "7天", "description": "在挑战中蜕变"}]'::jsonb,
  '["视频课程学习", "日常练习打卡", "社群讨论交流", "教练1对1辅导"]'::jsonb,
  '["想要深入了解自己的人", "感到迷茫、不知道自己是谁", "想要突破自我限制", "渴望活出真实自我的人", "想要建立稳固的自我认同", "希望提升自信和自我价值感"]'::jsonb,
  '["清晰的自我认知", "稳固的身份感", "更高的自信水平", "突破限制性信念", "更真实的自我表达", "内在力量的觉醒"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

-- Insert 情感绽放训练营
INSERT INTO public.camp_templates (
  camp_type, camp_name, camp_subtitle, description, duration_days, 
  theme_color, gradient, icon, display_order,
  stages, learning_formats, target_audience, benefits, daily_practice, weekly_activities, research_stats, prerequisites
) VALUES (
  'emotion_bloom',
  '情感绽放训练营',
  'Emotional Flourishing',
  '建立健康的情感关系，体验深度连接',
  28,
  'green',
  'from-emerald-500 to-teal-500',
  '💚',
  3,
  '[{"stage": 1, "title": "情感觉察", "duration": "7天", "description": "认识和理解情感模式"}, {"stage": 2, "title": "情感表达", "duration": "7天", "description": "学习健康的情感表达"}, {"stage": 3, "title": "关系建立", "duration": "7天", "description": "建立深度连接"}, {"stage": 4, "title": "情感成熟", "duration": "7天", "description": "培养成熟的情感智慧"}]'::jsonb,
  '["视频课程学习", "情感日记", "社群讨论", "伴侣练习（选修）"]'::jsonb,
  '["想要改善亲密关系的人", "情感表达困难的人", "渴望深度连接的人", "想要提升情感智慧", "经历情感创伤寻求疗愈", "想要建立健康关系模式"]'::jsonb,
  '["健康的情感表达能力", "深度的情感连接", "成熟的情感智慧", "疗愈过往情感创伤", "建立安全的依恋关系", "提升亲密关系质量"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{"required_camp": "identity_bloom", "message": "需要先完成「身份绽放训练营」四阶课程"}'::jsonb
);