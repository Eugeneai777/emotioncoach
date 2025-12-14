-- 更新亲子训练营模板的渐变色为紫粉色
UPDATE camp_templates 
SET gradient = 'from-purple-500 to-pink-500',
    theme_color = 'purple'
WHERE camp_type = 'parent_emotion_21';