-- Create emotion quick logs table for fast emotion intensity recording
CREATE TABLE public.emotion_quick_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emotion_intensity INTEGER NOT NULL CHECK (emotion_intensity >= 1 AND emotion_intensity <= 10),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emotion_quick_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quick logs"
ON public.emotion_quick_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick logs"
ON public.emotion_quick_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick logs"
ON public.emotion_quick_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_emotion_quick_logs_user_created 
ON public.emotion_quick_logs(user_id, created_at DESC);