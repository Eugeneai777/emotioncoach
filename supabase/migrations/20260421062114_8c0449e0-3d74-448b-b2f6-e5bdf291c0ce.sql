
-- 1. 新建 user_identities 表
CREATE TABLE public.user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('phone', 'wechat', 'email')),
  provider_uid text NOT NULL,
  password_hash text,
  is_primary boolean NOT NULL DEFAULT false,
  bound_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_uid)
);

CREATE INDEX idx_user_identities_user_id ON public.user_identities(user_id);
CREATE INDEX idx_user_identities_lookup ON public.user_identities(provider, provider_uid);

-- 2. 启用 RLS
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

-- 3. RLS 策略：用户只能查看自己的 identities
CREATE POLICY "Users can view their own identities"
  ON public.user_identities FOR SELECT
  USING (auth.uid() = user_id);

-- 4. 禁止客户端直接写入（只允许 service_role 操作）
CREATE POLICY "Service role manages identities"
  ON public.user_identities FOR ALL
  USING (false)
  WITH CHECK (false);

-- 5. updated_at 自动维护
CREATE TRIGGER trg_user_identities_updated_at
  BEFORE UPDATE ON public.user_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. 写入灰度名单配置
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'pilot_unified_login_phones',
  '["18001356892"]'::jsonb,
  '灰度名单：这些手机号走 user_identities 统一登录链路（unified-login edge function）'
)
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();
