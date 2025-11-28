-- 更新21天情绪日记训练营的副标题为中文
UPDATE camp_templates 
SET camp_subtitle = '每天记录情绪，积累成长力量'
WHERE camp_type = 'emotion_journal_21';