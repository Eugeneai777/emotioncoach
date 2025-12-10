
-- Add new columns to gratitude_entries table
ALTER TABLE gratitude_entries 
ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT FALSE;

-- Create index for better theme filtering
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_themes ON gratitude_entries USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON gratitude_entries(date);

-- Create gratitude theme definitions table
CREATE TABLE IF NOT EXISTS gratitude_theme_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE gratitude_theme_definitions ENABLE ROW LEVEL SECURITY;

-- Anyone can read theme definitions
CREATE POLICY "Anyone can view theme definitions" 
ON gratitude_theme_definitions 
FOR SELECT 
USING (true);

-- Insert the 7 theme definitions
INSERT INTO gratitude_theme_definitions (id, name, emoji, color, description, keywords, display_order) VALUES
('CREATION', '创造/工作/项目', '🧠', 'hsl(210, 75%, 55%)', '工作进展、产品、创意、学习、技能提升、任何「做出东西」的事件', ARRAY['工作', '项目', '学习', '创意', '技能', '产品', '代码', '设计', '写作', '完成', '进展', '突破', 'work', 'project', 'learn', 'create', 'build', 'code', 'design', 'AI', '开发', '上线', '发布'], 1),
('RELATIONSHIPS', '亲密关系/家人/朋友', '❤️', 'hsl(350, 75%, 55%)', '伴侣、孩子、父母、朋友、同事、团队、属灵同伴', ARRAY['家人', '朋友', '伴侣', '孩子', '父母', '同事', '团队', '聚会', '陪伴', '聊天', '约会', 'family', 'friend', 'partner', 'team', '老婆', '老公', '妈妈', '爸爸', '儿子', '女儿', '闺蜜', '兄弟'], 2),
('MONEY', '金钱/资源/机会', '💰', 'hsl(45, 85%, 50%)', '收入、投资、折扣、奖金、资源、人脉、贵人', ARRAY['收入', '赚钱', '投资', '折扣', '奖金', '资源', '机会', '贵人', '合作', '客户', '订单', '融资', 'money', 'income', 'investment', 'opportunity', '省钱', '涨薪', '分红'], 3),
('HEALTH', '身体/健康/休息', '🩺', 'hsl(150, 65%, 45%)', '睡眠、体重变化、运动、医疗、疗愈、按摩、spa、养生', ARRAY['睡眠', '运动', '健身', '跑步', '瑜伽', '休息', '按摩', '体检', '康复', '早起', '健康', 'health', 'sleep', 'exercise', 'gym', 'yoga', '散步', '游泳', '减肥'], 4),
('INNER', '内在成长/情绪/灵性', '🌱', 'hsl(120, 50%, 45%)', '觉察、突破、疗愈、自我接纳、信仰、启发、看见盲点', ARRAY['觉察', '成长', '突破', '疗愈', '接纳', '信仰', '启发', '冥想', '祷告', '反思', '领悟', '放下', 'growth', 'insight', 'meditation', 'spiritual', '情绪', '内心', '平静'], 5),
('JOY', '享乐/旅行/美好体验', '🎉', 'hsl(280, 65%, 55%)', '美食、旅行、音乐、电影、庆祝、节日、自然风景', ARRAY['旅行', '美食', '电影', '音乐', '庆祝', '节日', '风景', '咖啡', '餐厅', '度假', '派对', 'travel', 'food', 'movie', 'music', 'party', '开心', '快乐', '享受', '好吃'], 6),
('IMPACT', '贡献/影响力/服务', '🤝', 'hsl(200, 70%, 50%)', '帮助别人、教练、分享、讲课、服务、给予、带来改变', ARRAY['帮助', '分享', '教练', '服务', '贡献', '影响', '志愿', '捐赠', '支持', '鼓励', 'help', 'share', 'coach', 'serve', 'impact', '付出', '给予', '陪伴他人'], 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order;

-- Create gratitude_reports table for storing generated reports
CREATE TABLE IF NOT EXISTS gratitude_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_entries INTEGER DEFAULT 0,
  theme_stats JSONB DEFAULT '{}', -- {"CREATION": 5, "RELATIONSHIPS": 3, ...}
  analysis_content TEXT, -- AI generated markdown analysis
  highlights JSONB DEFAULT '[]', -- Top 10 entries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE gratitude_reports ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reports
CREATE POLICY "Users can manage their own gratitude reports" 
ON gratitude_reports 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_gratitude_reports_user_date ON gratitude_reports(user_id, start_date, end_date);
