-- Create user_voice_clones table for storing user's cloned voice information
CREATE TABLE public.user_voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elevenlabs_voice_id TEXT NOT NULL,
  voice_name TEXT,
  sample_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_voice_clones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own voice clones"
ON public.user_voice_clones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice clones"
ON public.user_voice_clones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice clones"
ON public.user_voice_clones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice clones"
ON public.user_voice_clones FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_voice_clones_updated_at
BEFORE UPDATE ON public.user_voice_clones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();