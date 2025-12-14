-- 添加 theme_config JSONB 字段到 coach_templates 表
ALTER TABLE coach_templates 
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;

-- 为情绪教练填充主题配置 (green/teal)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-emerald-50/80 via-teal-50/50 to-green-50/30",
    "dark": "from-emerald-950/20 via-teal-950/10 to-green-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-green-50/50 border-emerald-200/50",
    "dark": "from-emerald-950/30 via-teal-950/20 to-green-950/20 border-emerald-800/30"
  },
  "stepIcon": {
    "light": "bg-emerald-100 text-emerald-600",
    "dark": "bg-emerald-900/50 text-emerald-400"
  },
  "loaderColor": "text-emerald-500",
  "accentColor": "emerald"
}'::jsonb
WHERE coach_key = 'emotion';

-- 为亲子教练填充主题配置 (purple/pink)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-purple-50/80 via-pink-50/50 to-rose-50/30",
    "dark": "from-purple-950/20 via-pink-950/10 to-rose-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/50 border-purple-200/50",
    "dark": "from-purple-950/30 via-pink-950/20 to-rose-950/20 border-purple-800/30"
  },
  "stepIcon": {
    "light": "bg-purple-100 text-purple-600",
    "dark": "bg-purple-900/50 text-purple-400"
  },
  "loaderColor": "text-purple-500",
  "accentColor": "purple"
}'::jsonb
WHERE coach_key = 'parent';

-- 为沟通教练填充主题配置 (blue)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-blue-50/80 via-indigo-50/50 to-violet-50/30",
    "dark": "from-blue-950/20 via-indigo-950/10 to-violet-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/50 border-blue-200/50",
    "dark": "from-blue-950/30 via-indigo-950/20 to-violet-950/20 border-blue-800/30"
  },
  "stepIcon": {
    "light": "bg-blue-100 text-blue-600",
    "dark": "bg-blue-900/50 text-blue-400"
  },
  "loaderColor": "text-blue-500",
  "accentColor": "blue"
}'::jsonb
WHERE coach_key = 'communication';

-- 为感恩教练填充主题配置 (pink)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-pink-50/80 via-rose-50/50 to-fuchsia-50/30",
    "dark": "from-pink-950/20 via-rose-950/10 to-fuchsia-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-fuchsia-50/50 border-pink-200/50",
    "dark": "from-pink-950/30 via-rose-950/20 to-fuchsia-950/20 border-pink-800/30"
  },
  "stepIcon": {
    "light": "bg-pink-100 text-pink-600",
    "dark": "bg-pink-900/50 text-pink-400"
  },
  "loaderColor": "text-pink-500",
  "accentColor": "pink"
}'::jsonb
WHERE coach_key = 'gratitude';

-- 为有劲生活教练填充主题配置 (teal)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-teal-50/80 via-cyan-50/50 to-blue-50/30",
    "dark": "from-teal-950/20 via-cyan-950/10 to-blue-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-teal-50/80 via-cyan-50/60 to-blue-50/50 border-teal-200/50",
    "dark": "from-teal-950/30 via-cyan-950/20 to-blue-950/20 border-teal-800/30"
  },
  "stepIcon": {
    "light": "bg-teal-100 text-teal-600",
    "dark": "bg-teal-900/50 text-teal-400"
  },
  "loaderColor": "text-teal-500",
  "accentColor": "teal"
}'::jsonb
WHERE coach_key = 'vibrant_life';

-- 为故事教练填充主题配置 (amber/orange)
UPDATE coach_templates SET theme_config = '{
  "backgroundGradient": {
    "light": "from-amber-50/80 via-orange-50/50 to-yellow-50/30",
    "dark": "from-amber-950/20 via-orange-950/10 to-yellow-950/10"
  },
  "stepCard": {
    "light": "bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/50 border-amber-200/50",
    "dark": "from-amber-950/30 via-orange-950/20 to-yellow-950/20 border-amber-800/30"
  },
  "stepIcon": {
    "light": "bg-amber-100 text-amber-600",
    "dark": "bg-amber-900/50 text-amber-400"
  },
  "loaderColor": "text-amber-500",
  "accentColor": "amber"
}'::jsonb
WHERE coach_key = 'story';