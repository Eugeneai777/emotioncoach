-- Extend camp_daily_progress table for video tracking
ALTER TABLE camp_daily_progress 
ADD COLUMN IF NOT EXISTS recommended_videos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS videos_watched_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_learning_completed BOOLEAN DEFAULT false;

-- Create camp_video_tasks table
CREATE TABLE IF NOT EXISTS camp_video_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES training_camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES video_courses(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  reason TEXT,
  match_score INTEGER,
  is_completed BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camp_id, user_id, video_id, progress_date)
);

-- Enable RLS
ALTER TABLE camp_video_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camp_video_tasks
CREATE POLICY "用户可以查看自己的视频任务"
  ON camp_video_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的视频任务"
  ON camp_video_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的视频任务"
  ON camp_video_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的视频任务"
  ON camp_video_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_camp_video_tasks_user_date 
  ON camp_video_tasks(user_id, progress_date);

CREATE INDEX IF NOT EXISTS idx_camp_video_tasks_camp_date 
  ON camp_video_tasks(camp_id, progress_date);