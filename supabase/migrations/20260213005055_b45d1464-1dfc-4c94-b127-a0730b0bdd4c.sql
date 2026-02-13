
-- Add RLS policies for content_admin on community_posts
CREATE POLICY "Content admins can select community posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'content_admin'));

CREATE POLICY "Content admins can update community posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'content_admin'));

CREATE POLICY "Content admins can delete community posts"
ON public.community_posts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'content_admin'));
