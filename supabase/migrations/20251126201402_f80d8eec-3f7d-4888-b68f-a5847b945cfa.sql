-- Create video_courses table for storing course video information
CREATE TABLE IF NOT EXISTS public.video_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  tags TEXT[],
  source TEXT DEFAULT 'youjin365',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_courses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view courses
CREATE POLICY "Anyone can view courses"
  ON public.video_courses
  FOR SELECT
  USING (true);

-- Create index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_video_courses_keywords ON public.video_courses USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_video_courses_tags ON public.video_courses USING GIN(tags);