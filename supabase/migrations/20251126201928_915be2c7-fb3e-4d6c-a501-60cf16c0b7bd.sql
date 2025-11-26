-- Create video watch history table
CREATE TABLE IF NOT EXISTS public.video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT now(),
  watch_duration INTEGER, -- 观看时长（秒）
  completed BOOLEAN DEFAULT false, -- 是否看完
  UNIQUE(user_id, video_id, watched_at)
);

-- Create video favorites table
CREATE TABLE IF NOT EXISTS public.video_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT, -- 用户笔记
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_watch_history
CREATE POLICY "Users can view their own watch history"
  ON public.video_watch_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watch history"
  ON public.video_watch_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history"
  ON public.video_watch_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history"
  ON public.video_watch_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for video_favorites
CREATE POLICY "Users can view their own favorites"
  ON public.video_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON public.video_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
  ON public.video_favorites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.video_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for video_courses
CREATE POLICY "Admins can insert courses"
  ON public.video_courses
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses"
  ON public.video_courses
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses"
  ON public.video_courses
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_watch_history_user_id ON public.video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_history_video_id ON public.video_watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_video_favorites_user_id ON public.video_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_video_favorites_video_id ON public.video_favorites(video_id);