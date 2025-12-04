-- 1. 添加 is_ai_generated 列
ALTER TABLE user_voice_recordings 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- 2. 添加 emotion_type 列，默认为 'panic' 兼容现有数据
ALTER TABLE user_voice_recordings 
ADD COLUMN IF NOT EXISTS emotion_type TEXT DEFAULT 'panic';

-- 3. 删除旧的唯一约束（如果存在）
ALTER TABLE user_voice_recordings 
DROP CONSTRAINT IF EXISTS user_voice_recordings_user_id_reminder_index_key;

-- 4. 创建新的唯一约束（用户+情绪类型+提醒索引）
ALTER TABLE user_voice_recordings 
ADD CONSTRAINT user_voice_recordings_user_emotion_reminder_key 
UNIQUE (user_id, emotion_type, reminder_index);