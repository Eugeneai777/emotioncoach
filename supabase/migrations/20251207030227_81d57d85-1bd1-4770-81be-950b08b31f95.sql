-- Drop the overly permissive policy on partner_commissions
DROP POLICY IF EXISTS "系统可以创建佣金记录" ON public.partner_commissions;

-- Create service-role-only policy for system operations
CREATE POLICY "Service role can create commissions" ON public.partner_commissions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');