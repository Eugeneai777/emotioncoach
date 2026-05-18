
-- 1. coach_invitations: drop authenticated-readable policy, must use lookup_coach_invitation RPC
DROP POLICY IF EXISTS "Authenticated users can view invitation by token" ON public.coach_invitations;

-- 2. human_coaches: drop broad authenticated view of full row (exposes phone/balances)
-- Anon/public should query human_coaches_public view instead
DROP POLICY IF EXISTS "Authenticated can view active coaches" ON public.human_coaches;

-- 3. parent_problem_types: restrict to authenticated to protect system_prompt_modifier / stage_prompts
DROP POLICY IF EXISTS "Anyone can read problem types" ON public.parent_problem_types;
CREATE POLICY "Authenticated can read problem types"
ON public.parent_problem_types
FOR SELECT
TO authenticated
USING (true);
