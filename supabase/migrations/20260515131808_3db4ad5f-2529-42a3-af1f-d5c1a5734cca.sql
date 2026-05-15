-- Backup current male_midlife_vitality template before rewriting
CREATE TABLE IF NOT EXISTS public._backup_male_vitality_template_20260515 AS
SELECT * FROM public.partner_assessment_templates
WHERE assessment_key = 'male_midlife_vitality';

ALTER TABLE public._backup_male_vitality_template_20260515 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_access_backup_male_vitality_20260515"
ON public._backup_male_vitality_template_20260515
FOR ALL
USING (false);