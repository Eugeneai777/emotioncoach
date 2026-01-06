-- 升级 user_wealth_profile 表：添加活画像更新所需字段
ALTER TABLE public.user_wealth_profile 
ADD COLUMN IF NOT EXISTS profile_snapshots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_updated_from_journal TIMESTAMPTZ;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.user_wealth_profile.profile_snapshots IS '历史画像快照数组，格式：[{week: 1, snapshot: {...}, created_at: ...}]';
COMMENT ON COLUMN public.user_wealth_profile.current_week IS '当前训练周数';
COMMENT ON COLUMN public.user_wealth_profile.last_updated_from_journal IS '最后一次从日记更新画像的时间';