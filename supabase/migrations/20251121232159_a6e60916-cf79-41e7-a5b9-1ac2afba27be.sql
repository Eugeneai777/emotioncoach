-- Create smart_notifications table
CREATE TABLE public.smart_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'encouragement', 'reminder', 'milestone', 'care', 'insight', 'celebration'
  scenario TEXT NOT NULL, -- 'after_briefing', 'goal_milestone', 'emotion_improvement', 'consistent_checkin', 'inactivity', 'sustained_low_mood'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB, -- 存储触发通知的上下文数据
  icon TEXT, -- lucide icon name
  action_text TEXT,
  action_type TEXT, -- 'navigate', 'open_dialog', 'dismiss'
  action_data JSONB, -- action相关的数据
  priority INTEGER NOT NULL DEFAULT 1, -- 1-5, 5最高
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for smart_notifications
CREATE INDEX idx_smart_notifications_user_id ON public.smart_notifications(user_id);
CREATE INDEX idx_smart_notifications_created_at ON public.smart_notifications(created_at DESC);
CREATE INDEX idx_smart_notifications_is_read ON public.smart_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_smart_notifications_priority ON public.smart_notifications(priority DESC);

-- Enable RLS
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for smart_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.smart_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.smart_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.smart_notifications FOR INSERT
  WITH CHECK (true);

-- Create user_behavior_analysis table
CREATE TABLE public.user_behavior_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_count INTEGER NOT NULL DEFAULT 0,
  days_since_last_checkin INTEGER,
  last_checkin_at TIMESTAMP WITH TIME ZONE,
  emotion_trend TEXT, -- 'improving', 'declining', 'stable', 'volatile'
  avg_emotion_intensity NUMERIC,
  dominant_emotions TEXT[], -- 最常见的情绪主题
  active_goals_count INTEGER NOT NULL DEFAULT 0,
  goals_on_track INTEGER NOT NULL DEFAULT 0,
  goals_at_risk INTEGER NOT NULL DEFAULT 0,
  needs_encouragement BOOLEAN NOT NULL DEFAULT false,
  needs_reminder BOOLEAN NOT NULL DEFAULT false,
  needs_care BOOLEAN NOT NULL DEFAULT false,
  growth_indicators JSONB, -- 成长指标数据
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, analysis_date)
);

-- Create indexes for user_behavior_analysis
CREATE INDEX idx_user_behavior_analysis_user_id ON public.user_behavior_analysis(user_id);
CREATE INDEX idx_user_behavior_analysis_date ON public.user_behavior_analysis(analysis_date DESC);
CREATE INDEX idx_user_behavior_analysis_needs ON public.user_behavior_analysis(user_id) 
  WHERE needs_encouragement = true OR needs_reminder = true OR needs_care = true;

-- Enable RLS
ALTER TABLE public.user_behavior_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_behavior_analysis
CREATE POLICY "Users can view their own analysis"
  ON public.user_behavior_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage analysis"
  ON public.user_behavior_analysis FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_user_behavior_analysis_updated_at
  BEFORE UPDATE ON public.user_behavior_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend profiles table with notification preferences
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS smart_notification_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'balanced', -- 'minimal', 'balanced', 'frequent'
  ADD COLUMN IF NOT EXISTS preferred_encouragement_style TEXT DEFAULT 'gentle'; -- 'gentle', 'cheerful', 'motivational'

-- Enable realtime for smart_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_notifications;