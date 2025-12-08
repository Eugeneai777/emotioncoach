-- Fix orders table UPDATE RLS policy to only allow system (service role) updates
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "系统可以更新订单" ON public.orders;

-- Create a more restrictive policy: users can only view their own orders
-- System updates should be done via service_role which bypasses RLS
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users should NOT be able to update orders directly - only the system should
-- Service role (used by edge functions) bypasses RLS, so no UPDATE policy needed for normal users