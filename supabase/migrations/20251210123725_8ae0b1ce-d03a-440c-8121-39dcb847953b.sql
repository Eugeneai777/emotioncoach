
UPDATE coach_templates 
SET steps = '[
  {"id": 1, "emoji": "👁️", "name": "Aware · 看见", "description": "今天发生了什么让你有一点点触动？"},
  {"id": 2, "emoji": "💭", "name": "Appraise · 感受", "description": "这个瞬间给你带来什么感受？"},
  {"id": 3, "emoji": "🌱", "name": "Appreciate · 意义", "description": "这说明你生活中有什么微小的美好？"},
  {"id": 4, "emoji": "💪", "name": "Align · 力量", "description": "这给你带来什么内心的力量？"}
]'::jsonb,
updated_at = now()
WHERE coach_key = 'gratitude_coach';
