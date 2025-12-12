-- 为所有缺少版本记录的教练创建初始版本（v1）
INSERT INTO coach_prompt_versions (coach_template_id, version_number, system_prompt, change_note, created_by)
SELECT 
  ct.id,
  1,
  ct.system_prompt,
  '初始版本 - 从数据库同步',
  NULL
FROM coach_templates ct
WHERE ct.system_prompt IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM coach_prompt_versions cpv 
    WHERE cpv.coach_template_id = ct.id
  );