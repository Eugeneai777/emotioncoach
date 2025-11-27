-- 将指定用户设置为管理员
INSERT INTO public.user_roles (user_id, role)
VALUES ('13807a48-2b04-4c09-8fa0-1eb678cc58ce', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;