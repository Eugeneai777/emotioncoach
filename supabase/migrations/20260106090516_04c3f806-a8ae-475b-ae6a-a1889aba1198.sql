-- Create table for user favorite beliefs with reminder functionality
CREATE TABLE public.user_favorite_beliefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  camp_id UUID REFERENCES public.training_camps(id),
  belief_text TEXT NOT NULL,
  is_reminder BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  source_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate beliefs per user
  UNIQUE(user_id, belief_text)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorite_beliefs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite beliefs" 
ON public.user_favorite_beliefs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite beliefs" 
ON public.user_favorite_beliefs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite beliefs" 
ON public.user_favorite_beliefs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite beliefs" 
ON public.user_favorite_beliefs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_user_favorite_beliefs_user_id ON public.user_favorite_beliefs(user_id);
CREATE INDEX idx_user_favorite_beliefs_reminder ON public.user_favorite_beliefs(user_id, is_reminder) WHERE is_reminder = true;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_favorite_beliefs_updated_at
BEFORE UPDATE ON public.user_favorite_beliefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();