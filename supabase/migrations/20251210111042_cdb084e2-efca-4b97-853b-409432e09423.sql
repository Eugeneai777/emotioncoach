-- Create coach prompt versions table for tracking prompt history
CREATE TABLE public.coach_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_template_id UUID NOT NULL REFERENCES public.coach_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  change_note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(coach_template_id, version_number)
);

-- Enable RLS
ALTER TABLE public.coach_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage prompt versions" ON public.coach_prompt_versions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view prompt versions" ON public.coach_prompt_versions
  FOR SELECT USING (true);

-- Create index for faster queries
CREATE INDEX idx_coach_prompt_versions_template ON public.coach_prompt_versions(coach_template_id, version_number DESC);