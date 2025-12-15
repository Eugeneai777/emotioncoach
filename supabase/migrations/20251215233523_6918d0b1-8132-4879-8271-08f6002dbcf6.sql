-- 添加个人资料增强字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mood_status TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- 创建函数：检查资料完整度（display_name + avatar_url 都有值）
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completed := (
    NEW.display_name IS NOT NULL AND 
    NEW.display_name != '' AND 
    NEW.avatar_url IS NOT NULL AND 
    NEW.avatar_url != ''
  );
  IF NEW.profile_completed = true AND (OLD.profile_completed_at IS NULL OR OLD.profile_completed = false) THEN
    NEW.profile_completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_check_profile_completion ON profiles;

-- 创建触发器
CREATE TRIGGER trigger_check_profile_completion
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_profile_completion();

-- 更新现有用户的 profile_completed 状态
UPDATE profiles 
SET profile_completed = (
  display_name IS NOT NULL AND 
  display_name != '' AND 
  avatar_url IS NOT NULL AND 
  avatar_url != ''
)
WHERE id IS NOT NULL;