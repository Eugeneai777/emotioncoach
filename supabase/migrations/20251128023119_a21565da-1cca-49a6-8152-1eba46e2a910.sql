-- 为身份绽放训练营和情感绽放训练营补充每日练习数据
UPDATE camp_templates
SET daily_practice = '[
  {"time": "☀️ 早上", "title": "晨间觉察", "content": "10分钟音频课学习，开启自我探索", "duration": "10分钟", "gradient": "from-amber-500 to-orange-500"},
  {"time": "🌤️ 白天", "title": "练习反思", "content": "完成课后练习，记录内心感受", "duration": "15分钟", "gradient": "from-blue-500 to-cyan-500"},
  {"time": "🌙 晚上", "title": "教练陪伴", "content": "参与教练课程，深度探索自我", "duration": "45分钟", "gradient": "from-purple-500 to-pink-500"}
]'::jsonb
WHERE camp_type = 'identity_bloom';

UPDATE camp_templates
SET daily_practice = '[
  {"time": "☀️ 早上", "title": "情绪觉察", "content": "音频课学习，认识情绪模式", "duration": "10分钟", "gradient": "from-amber-500 to-orange-500"},
  {"time": "🌤️ 白天", "title": "情绪日记", "content": "记录当天情绪，深入自我觉察", "duration": "10分钟", "gradient": "from-blue-500 to-cyan-500"},
  {"time": "🌙 晚上", "title": "深度探索", "content": "教练课程+直播答疑，全方位支持", "duration": "60分钟", "gradient": "from-purple-500 to-pink-500"}
]'::jsonb
WHERE camp_type = 'emotion_bloom';