
-- Update emotion coach steps to simplified version (Option C: keep one transformation line)
UPDATE coach_templates
SET steps = '[
  {
    "id": 1,
    "emoji": "1️⃣",
    "name": "觉察",
    "description": "此刻我的身体感受是什么？",
    "details": "从不知道 → 有觉察"
  },
  {
    "id": 2,
    "emoji": "2️⃣",
    "name": "看见",
    "description": "引发情绪的原因是什么？",
    "details": "从单一视角 → 多元觉察"
  },
  {
    "id": 3,
    "emoji": "3️⃣",
    "name": "理解",
    "description": "我真正在意的是什么？",
    "details": "从反应 → 回应"
  },
  {
    "id": 4,
    "emoji": "4️⃣",
    "name": "行动",
    "description": "我可以为自己做些什么？",
    "details": "从无力 → 赋能"
  }
]'::jsonb,
updated_at = now()
WHERE coach_key = 'emotion';
