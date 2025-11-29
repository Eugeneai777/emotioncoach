-- Add coach_type column to smart_notifications table for filtering by coach source
ALTER TABLE public.smart_notifications 
ADD COLUMN coach_type TEXT DEFAULT 'emotion_coach' CHECK (coach_type IN ('emotion_coach', 'parent_coach', 'life_coach', 'general'));

-- Create index for better query performance
CREATE INDEX idx_smart_notifications_coach_type ON public.smart_notifications(coach_type);

-- Add comment
COMMENT ON COLUMN public.smart_notifications.coach_type IS 'The type of coach that generated this notification: emotion_coach, parent_coach, life_coach, or general';