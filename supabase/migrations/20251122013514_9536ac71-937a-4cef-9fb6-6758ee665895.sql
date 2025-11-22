-- 1. 创建角色枚举类型
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. 创建用户角色表
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. 创建角色检查函数（security definer避免RLS递归）
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. 创建企业微信机器人全局配置表
CREATE TABLE public.wecom_bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  encoding_aes_key text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.wecom_bot_config ENABLE ROW LEVEL SECURITY;

-- 只允许一条全局配置记录
CREATE UNIQUE INDEX wecom_bot_config_singleton ON public.wecom_bot_config ((true));

-- 5. 创建企业微信用户映射表
CREATE TABLE public.wecom_user_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wecom_user_id text NOT NULL UNIQUE,
  system_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.wecom_user_mappings ENABLE ROW LEVEL SECURITY;

-- 6. RLS策略 - user_roles表
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RLS策略 - wecom_bot_config表
CREATE POLICY "Admins can view bot config"
ON public.wecom_bot_config FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage bot config"
ON public.wecom_bot_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. RLS策略 - wecom_user_mappings表
CREATE POLICY "Users can view their own mapping"
ON public.wecom_user_mappings FOR SELECT
TO authenticated
USING (auth.uid() = system_user_id);

CREATE POLICY "Admins can view all mappings"
ON public.wecom_user_mappings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage mappings"
ON public.wecom_user_mappings FOR ALL
USING (true)
WITH CHECK (true);

-- 9. 创建触发器以自动更新 updated_at
CREATE TRIGGER update_wecom_bot_config_updated_at
BEFORE UPDATE ON public.wecom_bot_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wecom_user_mappings_updated_at
BEFORE UPDATE ON public.wecom_user_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. 迁移现有配置：将第一个有企业微信配置的用户设为管理员，并迁移其配置到全局表
DO $$
DECLARE
  first_admin_id uuid;
  admin_token text;
  admin_key text;
BEGIN
  -- 查找第一个配置了企业微信机器人的用户
  SELECT id, wecom_bot_token, wecom_bot_encoding_aes_key
  INTO first_admin_id, admin_token, admin_key
  FROM public.profiles
  WHERE wecom_bot_token IS NOT NULL 
    AND wecom_bot_encoding_aes_key IS NOT NULL
  LIMIT 1;

  -- 如果找到了，设置为��理员并迁移配置
  IF first_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.wecom_bot_config (token, encoding_aes_key, enabled, created_by, updated_by)
    VALUES (admin_token, admin_key, true, first_admin_id, first_admin_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;