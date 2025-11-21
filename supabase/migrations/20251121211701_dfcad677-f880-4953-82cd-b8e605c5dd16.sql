-- 扩展tags表：添加情感分类字段
ALTER TABLE tags
ADD COLUMN sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
ADD COLUMN sentiment_confidence numeric DEFAULT 0,
ADD COLUMN last_sentiment_check timestamp with time zone;

-- 创建索引加速查询
CREATE INDEX idx_tags_sentiment ON tags(sentiment);
CREATE INDEX idx_tags_user_sentiment ON tags(user_id, sentiment);

-- 扩展emotion_goals表：添加标签目标字段
ALTER TABLE emotion_goals
ADD COLUMN target_tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
ADD COLUMN baseline_weekly_count integer,
ADD COLUMN target_reduction_percent numeric;

-- 更新goal_category约束以支持标签目标类型
ALTER TABLE emotion_goals 
DROP CONSTRAINT IF EXISTS emotion_goals_goal_category_check;

ALTER TABLE emotion_goals
ADD CONSTRAINT emotion_goals_goal_category_check 
CHECK (goal_category IN (
  'frequency', 
  'intensity_average', 
  'intensity_range_days', 
  'intensity_peak_control',
  'tag_reduction',
  'tag_increase'
));