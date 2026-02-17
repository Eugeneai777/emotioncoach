
-- 1. energy_studio_tools: 允许匿名用户查看已启用的工具
CREATE POLICY "匿名用户可查看启用的工具"
  ON public.energy_studio_tools
  FOR SELECT
  TO anon
  USING (is_available = true);

-- 2. video_courses: 允许匿名用户浏览课程
CREATE POLICY "匿名用户可浏览课程"
  ON public.video_courses
  FOR SELECT
  TO anon
  USING (true);

-- 3. community_posts: 允许匿名用户查看公开帖子
CREATE POLICY "匿名用户可查看公开帖子"
  ON public.community_posts
  FOR SELECT
  TO anon
  USING (visibility = 'public');
