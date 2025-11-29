-- 创建 coach_templates 表
CREATE TABLE public.coach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础标识
  coach_key TEXT UNIQUE NOT NULL,
  
  -- 主题配置
  emoji TEXT NOT NULL DEFAULT '💚',
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  gradient TEXT DEFAULT 'from-primary via-emerald-500 to-teal-500',
  primary_color TEXT DEFAULT 'green',
  
  -- 四部曲配置 (JSONB数组)
  steps JSONB DEFAULT '[]'::jsonb,
  steps_title TEXT DEFAULT '四部曲',
  steps_emoji TEXT DEFAULT '🌱',
  
  -- 路由配置
  page_route TEXT NOT NULL,
  history_route TEXT NOT NULL,
  history_label TEXT DEFAULT '我的日记',
  more_info_route TEXT,
  
  -- 交互配置
  placeholder TEXT DEFAULT '分享你的想法...',
  
  -- 功能开关
  enable_voice_control BOOLEAN DEFAULT true,
  enable_training_camp BOOLEAN DEFAULT false,
  enable_notifications BOOLEAN DEFAULT false,
  enable_community BOOLEAN DEFAULT false,
  enable_scenarios BOOLEAN DEFAULT false,
  
  -- Edge Function 配置
  edge_function_name TEXT,
  briefing_table_name TEXT,
  
  -- 管理字段
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建更新时间触发器
CREATE TRIGGER update_coach_templates_updated_at
  BEFORE UPDATE ON public.coach_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS 策略
ALTER TABLE public.coach_templates ENABLE ROW LEVEL SECURITY;

-- 所有用户可查看启用的教练模板
CREATE POLICY "Anyone can view active coach templates"
  ON public.coach_templates FOR SELECT
  USING (is_active = true);

-- 管理员可管理所有模板
CREATE POLICY "Admins can manage coach templates"
  ON public.coach_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 初始化现有教练配置
INSERT INTO public.coach_templates (
  coach_key, emoji, title, subtitle, description, gradient, primary_color,
  steps, steps_title, steps_emoji,
  page_route, history_route, history_label,
  placeholder, enable_voice_control, enable_scenarios,
  edge_function_name, briefing_table_name,
  is_system, display_order
) VALUES
  -- 情绪觉醒教练
  (
    'emotion', '💚', '情绪觉醒教练', '日常情绪觉察与记录', '通过对话梳理情绪，生成情绪简报',
    'from-primary via-emerald-500 to-teal-500', 'green',
    '[
      {"id": 1, "emoji": "1️⃣", "name": "觉察", "subtitle": "Feel It", "description": "此刻我的身体感受是什么？", "details": "从不知道 → 有觉察\n从混乱 → 清晰可描述\n从无力 → 自我关怀"},
      {"id": 2, "emoji": "2️⃣", "name": "看见", "subtitle": "See It", "description": "引发情绪的原因是什么？", "details": "从单一视角 → 多元觉察\n从表象 → 深层理解\n从归因他人 → 看见自己"},
      {"id": 3, "emoji": "3️⃣", "name": "理解", "subtitle": "Sense It", "description": "我真正在意的是什么？", "details": "从反应 → 回应\n从需要 → 价值观\n从情绪 → 智慧"},
      {"id": 4, "emoji": "4️⃣", "name": "行动", "subtitle": "Transform It", "description": "我可以为自己做些什么？", "details": "从无力 → 赋能\n从被动 → 主动\n从想法 → 行动"}
    ]'::jsonb,
    '四部曲', '🌱',
    '/', '/history', '我的日记',
    '告诉我你最近怎么样...', true, false,
    'chat', 'briefings',
    true, 1
  ),
  -- 家长情绪教练
  (
    'parent', '👨‍👩‍👧', '家长情绪教练', '亲子情绪四部曲', 'Feel · See · Sense · Transform',
    'from-orange-500 to-amber-500', 'orange',
    '[
      {"id": 1, "emoji": "1️⃣", "name": "感受它", "subtitle": "Feel It", "description": "觉察当下的身心感受", "details": "从混乱 → 清晰描述\n从排斥 → 接纳感受\n从评判 → 同理自己"},
      {"id": 2, "emoji": "2️⃣", "name": "看见它", "subtitle": "See It", "description": "看见情绪背后的渴望", "details": "从反应 → 理解\n从表象 → 深层需求\n从归因孩子 → 看见自己"},
      {"id": 3, "emoji": "3️⃣", "name": "理解它", "subtitle": "Sense It", "description": "连接价值观与智慧", "details": "从控制 → 引导\n从焦虑 → 信任\n从需要 → 意义"},
      {"id": 4, "emoji": "4️⃣", "name": "转化它", "subtitle": "Transform It", "description": "采取有意识的行动", "details": "从冲动 → 选择\n从无力 → 赋能\n从想法 → 改变"}
    ]'::jsonb,
    '四部曲', '🌸',
    '/parent-coach', '/parent-child-diary', '成长日记',
    '分享今天和孩子的互动...', true, false,
    'parent-emotion-coach', 'parent_coaching_sessions',
    true, 2
  ),
  -- 卡内基沟通教练
  (
    'communication', '💬', '卡内基沟通教练', 'Dale Carnegie', 'See · Understand · Influence · Act',
    'from-blue-500 to-indigo-500', 'blue',
    '[
      {"id": 1, "emoji": "1️⃣", "name": "看见", "subtitle": "See", "description": "把沟通问题变清晰", "details": "从混乱 → 清晰可操作\n从模糊 → 具体场景\n从困扰 → 机会"},
      {"id": 2, "emoji": "2️⃣", "name": "读懂", "subtitle": "Understand", "description": "读懂对方的感受与动机", "details": "一瞬间懂对方：感受 + 需求 + 底层期待"},
      {"id": 3, "emoji": "3️⃣", "name": "影响", "subtitle": "Influence", "description": "制定有效的沟通策略", "details": "从反应 → 策略\n从对抗 → 共赢\n从说服 → 影响"},
      {"id": 4, "emoji": "4️⃣", "name": "行动", "subtitle": "Act", "description": "设计具体的沟通话术", "details": "从想法 → 行动\n从理论 → 实践\n从害怕 → 自信"}
    ]'::jsonb,
    '四部曲', '🎯',
    '/communication-coach', '/communication-history', '沟通日记',
    '描述你的沟通场景...', true, true,
    'carnegie-coach', 'communication_briefings',
    true, 3
  );

-- 创建索引
CREATE INDEX idx_coach_templates_coach_key ON public.coach_templates(coach_key);
CREATE INDEX idx_coach_templates_active ON public.coach_templates(is_active, display_order);