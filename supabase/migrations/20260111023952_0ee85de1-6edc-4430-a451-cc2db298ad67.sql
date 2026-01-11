-- 为 daily_challenges 表添加新的关联字段
ALTER TABLE daily_challenges 
ADD COLUMN IF NOT EXISTS linked_focus_area TEXT,
ADD COLUMN IF NOT EXISTS linked_belief TEXT,
ADD COLUMN IF NOT EXISTS ai_insight_source TEXT;

-- 添加注释说明字段用途
COMMENT ON COLUMN daily_challenges.linked_focus_area IS '关联的本周训练重点';
COMMENT ON COLUMN daily_challenges.linked_belief IS '关联的用户收藏信念';
COMMENT ON COLUMN daily_challenges.ai_insight_source IS '推荐理由来源: keyword/belief/focus/pattern/layer';