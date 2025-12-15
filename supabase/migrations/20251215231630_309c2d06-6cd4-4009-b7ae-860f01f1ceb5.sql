-- 添加账号管理字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_profiles_is_disabled ON public.profiles(is_disabled) WHERE is_disabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- 更新管理员RLS策略允许更新这些字段
DROP POLICY IF EXISTS "管理员可更新用户状态" ON public.profiles;
CREATE POLICY "管理员可更新用户状态" ON public.profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));