-- 替换 profiles 的 SELECT 策略，允许所有已认证用户查看基本资料（昵称、头像是公开信息）
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');