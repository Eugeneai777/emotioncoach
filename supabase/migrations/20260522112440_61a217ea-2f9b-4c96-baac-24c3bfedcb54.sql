UPDATE public.partner_assessment_templates
SET 
  title = '男人身体警报自检',
  subtitle = '10 道题 · 3 个维度 · 5 分钟看清那些「说不出口」的信号',
  updated_at = now()
WHERE assessment_key = 'male_unspoken_check';