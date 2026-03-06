
-- 1. partner_assessment_templates table
CREATE TABLE public.partner_assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  assessment_key text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  emoji text DEFAULT '📋',
  gradient text DEFAULT 'from-blue-500 to-cyan-500',
  dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  scoring_logic text,
  ai_insight_prompt text,
  page_route text,
  is_active boolean NOT NULL DEFAULT true,
  max_score integer NOT NULL DEFAULT 0,
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_assessment_templates ENABLE ROW LEVEL SECURITY;

-- Partner can CRUD their own
CREATE POLICY "Partners can manage own assessments"
  ON public.partner_assessment_templates
  FOR ALL
  TO authenticated
  USING (created_by_partner_id = public.get_partner_id_for_user(auth.uid()))
  WITH CHECK (created_by_partner_id = public.get_partner_id_for_user(auth.uid()));

-- All authenticated users can read active assessments
CREATE POLICY "Authenticated users can read active assessments"
  ON public.partner_assessment_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins full access to assessments"
  ON public.partner_assessment_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. partner_assessment_results table
CREATE TABLE public.partner_assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.partner_assessment_templates(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimension_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_score integer NOT NULL DEFAULT 0,
  primary_pattern text,
  ai_insight text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_assessment_results ENABLE ROW LEVEL SECURITY;

-- Users can insert their own results
CREATE POLICY "Users can insert own results"
  ON public.partner_assessment_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own results
CREATE POLICY "Users can read own results"
  ON public.partner_assessment_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admins full access to assessment results"
  ON public.partner_assessment_results
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Partners can read results for their assessments
CREATE POLICY "Partners can read results for own assessments"
  ON public.partner_assessment_results
  FOR SELECT
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM public.partner_assessment_templates 
      WHERE created_by_partner_id = public.get_partner_id_for_user(auth.uid())
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_partner_assessment_templates_updated_at
  BEFORE UPDATE ON public.partner_assessment_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
