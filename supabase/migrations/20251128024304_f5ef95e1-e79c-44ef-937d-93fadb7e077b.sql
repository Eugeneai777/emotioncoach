-- 更新情感绽放训练营的前置条件配置
UPDATE camp_templates 
SET prerequisites = jsonb_build_object(
  'message', '建议与身份绽放训练营一起报名',
  'required_camp', null
)
WHERE camp_type = 'emotion_bloom';