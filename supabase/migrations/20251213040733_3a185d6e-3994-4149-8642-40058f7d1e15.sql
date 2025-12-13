-- 1. profiles 表 - 管理员可查看所有用户资料
CREATE POLICY "管理员可查看所有用户资料" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. orders 表 - 管理员可查看和管理所有订单
CREATE POLICY "管理员可查看所有订单" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可管理所有订单" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. usage_records 表 - 管理员可查看所有使用记录
CREATE POLICY "管理员可查看所有使用记录" 
ON public.usage_records 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. training_camps 表 - 管理员可查看和管理所有训练营
CREATE POLICY "管理员可查看所有训练营" 
ON public.training_camps 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可管理所有训练营" 
ON public.training_camps 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. conversations 表 - 管理员可查看所有对话
CREATE POLICY "管理员可查看所有对话" 
ON public.conversations 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. briefings 表 - 管理员可查看所有简报
CREATE POLICY "管理员可查看所有简报" 
ON public.briefings 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));