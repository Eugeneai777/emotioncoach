-- Drop the overly permissive policy on wechat_user_mappings
DROP POLICY IF EXISTS "System can manage mappings" ON public.wechat_user_mappings;

-- Create service-role-only policy for system operations
CREATE POLICY "Service role can manage mappings" ON public.wechat_user_mappings
FOR ALL USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');