UPDATE public.partner_assessment_templates
SET questions = REPLACE(questions::text, '/assessment-media/q1_spiral.png', '/assessment-media/q1_spiral.webp')::jsonb
WHERE assessment_key = 'male_midlife_vitality'
  AND questions::text LIKE '%/assessment-media/q1_spiral.png%';