
-- Create a security definer function to check if user follows another user
CREATE OR REPLACE FUNCTION public.is_following(follower uuid, following uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = follower AND following_id = following
  )
$$;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "所有已认证用户可查看公开帖子" ON public.community_posts;

-- Create new SELECT policy with visibility support
CREATE POLICY "用户可查看可见帖子" ON public.community_posts
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'followers_only' AND public.is_following(auth.uid(), user_id))
  )
);
