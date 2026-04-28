CREATE TABLE public.drama_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT,
  mode TEXT NOT NULL DEFAULT 'generic',
  theme TEXT NOT NULL,
  genre TEXT,
  style TEXT,
  conflict_intensity TEXT,
  target_audience TEXT,
  conversion_style TEXT,
  selected_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  script_data JSONB NOT NULL,
  series_id UUID NOT NULL DEFAULT gen_random_uuid(),
  parent_script_id UUID REFERENCES public.drama_scripts(id) ON DELETE SET NULL,
  episode_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.drama_scripts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_drama_scripts_created_at ON public.drama_scripts(created_at DESC);
CREATE INDEX idx_drama_scripts_series ON public.drama_scripts(series_id, episode_number);
CREATE INDEX idx_drama_scripts_creator ON public.drama_scripts(creator_id);

CREATE POLICY "Admins and content admins can view drama scripts"
ON public.drama_scripts
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'content_admin'::app_role)
);

CREATE POLICY "Admins and content admins can create drama scripts"
ON public.drama_scripts
FOR INSERT
WITH CHECK (
  creator_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'content_admin'::app_role)
  )
);

CREATE POLICY "Admins and content admins can update drama scripts"
ON public.drama_scripts
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'content_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'content_admin'::app_role)
);

CREATE POLICY "Admins and content admins can delete drama scripts"
ON public.drama_scripts
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'content_admin'::app_role)
);

CREATE TRIGGER update_drama_scripts_updated_at
BEFORE UPDATE ON public.drama_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();