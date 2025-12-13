-- 管理员可查看所有账户
CREATE POLICY "管理员可查看所有账户" 
ON public.user_accounts 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 管理员可管理所有账户
CREATE POLICY "管理员可管理所有账户" 
ON public.user_accounts 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));