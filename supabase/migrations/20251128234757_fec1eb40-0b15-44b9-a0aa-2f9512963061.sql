-- 修改 parent_coaching_sessions 表的 current_stage 约束
-- 允许 current_stage 从 0 开始（事件捕获阶段）

-- 移除旧的约束
ALTER TABLE parent_coaching_sessions 
DROP CONSTRAINT IF EXISTS parent_coaching_sessions_current_stage_check;

-- 添加新的约束，允许 0-4
ALTER TABLE parent_coaching_sessions 
ADD CONSTRAINT parent_coaching_sessions_current_stage_check 
CHECK ((current_stage >= 0) AND (current_stage <= 4));

-- 阶段定义：
-- Stage 0: 事件捕获（Event Capture）
-- Stage 1: Feel it（感受情绪）
-- Stage 2: See it（看见孩子）
-- Stage 3: Sense it（觉察反应）
-- Stage 4: Transform it（转化行动）