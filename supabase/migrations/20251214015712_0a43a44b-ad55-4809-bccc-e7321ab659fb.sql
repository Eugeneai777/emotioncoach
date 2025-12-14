-- 步骤1: 将重复的活跃训练营设为completed（保留每个用户每种类型最新的一个）
UPDATE training_camps 
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, camp_type 
      ORDER BY created_at DESC
    ) as rn 
    FROM training_camps 
    WHERE status = 'active'
  ) sub 
  WHERE rn > 1
);

-- 步骤2: 创建部分唯一索引，防止未来重复
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_camp_per_user 
ON training_camps (user_id, camp_type) 
WHERE status = 'active';