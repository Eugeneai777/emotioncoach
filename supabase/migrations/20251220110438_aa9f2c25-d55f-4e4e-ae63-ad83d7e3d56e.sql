-- Create decision_logs table for storing "选择觉醒" dimension records
CREATE TABLE public.decision_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decision_question TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  concerns TEXT,
  ai_analysis JSONB,
  chosen_option TEXT,
  outcome_note TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.decision_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own decision logs" 
ON public.decision_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decision logs" 
ON public.decision_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decision logs" 
ON public.decision_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decision logs" 
ON public.decision_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX idx_decision_logs_user_id ON public.decision_logs(user_id);
CREATE INDEX idx_decision_logs_created_at ON public.decision_logs(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_decision_logs_updated_at
BEFORE UPDATE ON public.decision_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();