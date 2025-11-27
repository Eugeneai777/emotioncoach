-- 将当前登录用户设置为管理员
-- 使用 INSERT ... ON CONFLICT 避免重复插入
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (user_id, role) DO NOTHING;