-- 扩展 emotion_goals 表以支持情绪强度目标
-- 添加目标类别字段
ALTER TABLE emotion_goals 
ADD COLUMN IF NOT EXISTS goal_category text DEFAULT 'frequency';

-- 添加强度目标相关字段
ALTER TABLE emotion_goals
ADD COLUMN IF NOT EXISTS intensity_min numeric,
ADD COLUMN IF NOT EXISTS intensity_max numeric,
ADD COLUMN IF NOT EXISTS intensity_target_days integer,
ADD COLUMN IF NOT EXISTS intensity_baseline numeric;

-- 添加检查约束确保 goal_category 的值有效
ALTER TABLE emotion_goals
DROP CONSTRAINT IF EXISTS emotion_goals_goal_category_check;

ALTER TABLE emotion_goals
ADD CONSTRAINT emotion_goals_goal_category_check 
CHECK (goal_category IN ('frequency', 'intensity_average', 'intensity_range_days', 'intensity_peak_control', 'intensity_trend'));