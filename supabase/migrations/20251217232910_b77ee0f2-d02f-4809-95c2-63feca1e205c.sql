-- Fix video_courses access: Require authentication to view courses
DROP POLICY IF EXISTS "Anyone can view courses" ON video_courses;

CREATE POLICY "Authenticated users can view courses"
  ON video_courses FOR SELECT
  USING (auth.uid() IS NOT NULL);