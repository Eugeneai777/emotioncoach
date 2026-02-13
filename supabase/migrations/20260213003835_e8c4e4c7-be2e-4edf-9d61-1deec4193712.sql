-- Allow admin users to view all community posts
CREATE POLICY "管理员可查看所有帖子" ON public.community_posts
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin users to update any community post (for pinning etc.)
CREATE POLICY "管理员可更新所有帖子" ON public.community_posts
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin users to delete any community post
CREATE POLICY "管理员可删除所有帖子" ON public.community_posts
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);