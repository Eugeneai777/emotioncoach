
-- =====================================================
-- 第一阶段：统一数据库设计 - 青少年模式双向联动系统
-- =====================================================

-- 1. 创建 parent_problem_types 表 - 8大问题类型配置
CREATE TABLE public.parent_problem_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT NOT NULL UNIQUE,
  type_name TEXT NOT NULL,
  type_icon TEXT DEFAULT '📝',
  type_color TEXT DEFAULT 'slate',
  description TEXT,
  parent_pain_points JSONB DEFAULT '[]',
  parent_common_emotions JSONB DEFAULT '[]',
  coaching_direction JSONB DEFAULT '[]',
  system_prompt_modifier TEXT,
  stage_prompts JSONB DEFAULT '{}',
  teen_context_focus JSONB DEFAULT '{}',
  intake_questions JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建 parent_problem_profile 表 - 用户问题类型识别结果
CREATE TABLE public.parent_problem_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_problem_type TEXT NOT NULL REFERENCES public.parent_problem_types(type_key),
  secondary_problem_types JSONB DEFAULT '[]',
  intake_answers JSONB DEFAULT '{}',
  intake_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. 创建 parent_teen_bindings 表 - 家长-青少年绑定关系
CREATE TABLE public.parent_teen_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teen_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  binding_code TEXT NOT NULL UNIQUE,
  code_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unbound')),
  bound_at TIMESTAMPTZ,
  unbound_at TIMESTAMPTZ,
  teen_nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 创建 teen_usage_logs 表 - 青少年使用记录（仅频率）
CREATE TABLE public.teen_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teen_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  binding_id UUID REFERENCES public.parent_teen_bindings(id) ON DELETE SET NULL,
  session_duration_seconds INTEGER,
  mood_indicator TEXT CHECK (mood_indicator IN ('stable', 'fluctuating', 'needs_attention')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 创建 teen_coaching_contexts 表 - 隐晦化引导上下文
CREATE TABLE public.teen_coaching_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id UUID NOT NULL REFERENCES public.parent_teen_bindings(id) ON DELETE CASCADE,
  parent_session_id UUID REFERENCES public.parent_coaching_sessions(id) ON DELETE SET NULL,
  problem_type TEXT REFERENCES public.parent_problem_types(type_key),
  inferred_situation TEXT,
  inferred_teen_feeling TEXT,
  parent_willing_change TEXT,
  communication_opportunity TEXT,
  additional_context JSONB DEFAULT '{}',
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 扩展 parent_coaching_sessions 表
ALTER TABLE public.parent_coaching_sessions 
ADD COLUMN IF NOT EXISTS problem_type TEXT,
ADD COLUMN IF NOT EXISTS teen_context JSONB DEFAULT NULL;

-- 7. 创建索引
CREATE INDEX idx_parent_problem_profile_user ON public.parent_problem_profile(user_id);
CREATE INDEX idx_parent_teen_bindings_parent ON public.parent_teen_bindings(parent_user_id);
CREATE INDEX idx_parent_teen_bindings_teen ON public.parent_teen_bindings(teen_user_id);
CREATE INDEX idx_parent_teen_bindings_code ON public.parent_teen_bindings(binding_code);
CREATE INDEX idx_teen_usage_logs_teen ON public.teen_usage_logs(teen_user_id);
CREATE INDEX idx_teen_usage_logs_binding ON public.teen_usage_logs(binding_id);
CREATE INDEX idx_teen_coaching_contexts_binding ON public.teen_coaching_contexts(binding_id);

-- 8. 启用 RLS
ALTER TABLE public.parent_problem_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_problem_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_teen_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teen_coaching_contexts ENABLE ROW LEVEL SECURITY;

-- 9. RLS 策略 - parent_problem_types (所有人可读)
CREATE POLICY "Anyone can read problem types" ON public.parent_problem_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage problem types" ON public.parent_problem_types
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. RLS 策略 - parent_problem_profile (用户只能访问自己的)
CREATE POLICY "Users can read own profile" ON public.parent_problem_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.parent_problem_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.parent_problem_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.parent_problem_profile
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. RLS 策略 - parent_teen_bindings
CREATE POLICY "Parents can read own bindings" ON public.parent_teen_bindings
  FOR SELECT USING (auth.uid() = parent_user_id);

CREATE POLICY "Teens can read own bindings" ON public.parent_teen_bindings
  FOR SELECT USING (auth.uid() = teen_user_id);

CREATE POLICY "Parents can create bindings" ON public.parent_teen_bindings
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update own bindings" ON public.parent_teen_bindings
  FOR UPDATE USING (auth.uid() = parent_user_id);

CREATE POLICY "Teens can update binding status" ON public.parent_teen_bindings
  FOR UPDATE USING (auth.uid() = teen_user_id);

CREATE POLICY "System can manage bindings" ON public.parent_teen_bindings
  FOR ALL USING (true) WITH CHECK (true);

-- 12. RLS 策略 - teen_usage_logs
CREATE POLICY "Teens can insert own logs" ON public.teen_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = teen_user_id);

CREATE POLICY "Teens can read own logs" ON public.teen_usage_logs
  FOR SELECT USING (auth.uid() = teen_user_id);

CREATE POLICY "Parents can read teen logs via binding" ON public.teen_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_teen_bindings
      WHERE parent_teen_bindings.id = teen_usage_logs.binding_id
      AND parent_teen_bindings.parent_user_id = auth.uid()
      AND parent_teen_bindings.status = 'active'
    )
  );

-- 13. RLS 策略 - teen_coaching_contexts
CREATE POLICY "System can manage contexts" ON public.teen_coaching_contexts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Teens can read own contexts via binding" ON public.teen_coaching_contexts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_teen_bindings
      WHERE parent_teen_bindings.id = teen_coaching_contexts.binding_id
      AND parent_teen_bindings.teen_user_id = auth.uid()
      AND parent_teen_bindings.status = 'active'
    )
  );

-- 14. 更新时间触发器
CREATE TRIGGER update_parent_problem_types_updated_at
  BEFORE UPDATE ON public.parent_problem_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_problem_profile_updated_at
  BEFORE UPDATE ON public.parent_problem_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_teen_bindings_updated_at
  BEFORE UPDATE ON public.parent_teen_bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 15. 预填充8种问题类型完整数据
-- =====================================================

INSERT INTO public.parent_problem_types (type_key, type_name, type_icon, type_color, description, parent_pain_points, parent_common_emotions, coaching_direction, system_prompt_modifier, stage_prompts, teen_context_focus, display_order) VALUES

-- 1. 抑郁倾向 / 情绪低落型
('depression', '抑郁倾向 / 情绪低落型', '🌧️', 'slate', '孩子情绪低落、不沟通、拒绝上学',
'["孩子不说话、不沟通", "拒绝上学", "情绪反复", "整天待在房间不出来", "对什么都提不起兴趣"]',
'["挫败", "自责", "恐惧", "不安", "无力"]',
'["稳定父母的恐惧", "教父母建立\"非评判连结\"", "避免逼迫、避免解释、避免逻辑劝说"]',
'【专属引导原则 - 抑郁倾向型】
这位父母的孩子可能正经历情绪低落或抑郁倾向。

核心策略：
- 首先稳定父母的恐惧，而非急于解决孩子的问题
- 帮助父母理解：孩子的沉默不是拒绝，是自我保护
- 引导父母建立"存在式陪伴"，而非"问题解决式干预"
- 强调"在场"比"说话"更重要

禁止事项：
- 不说"你要多和孩子沟通"
- 不建议"带孩子看医生/做检查"（除非有自伤风险）
- 不给时间期限（如"一周内会好转"）
- 不说"孩子只是想太多"',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的恐惧（怕孩子出事、怕未来、怕自己做得不好）", "承认自己很累、很无力", "不再把焦点放在孩子怎么变成这样上"],
    "guidance": ["看到孩子那样，你心里是什么感觉？害怕？还是心疼？", "有没有一个瞬间，你觉得特别无力？", "你最担心的是什么？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解孩子的沉默是自我保护", "看到孩子可能承受的内心压力", "不再急于让孩子\"好起来\""],
    "guidance": ["如果孩子的沉默是一种保护自己的方式，你怎么看？", "你觉得孩子心里可能在经历什么？", "有没有可能，孩子也很想好起来，只是暂时做不到？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到自己的焦虑可能传递给孩子", "发现自己常用的方式可能适得其反", "愿意暂停\"解决问题\"的冲动"],
    "guidance": ["当你很担心的时候，你通常会怎么做？", "这些做法之后，孩子的反应是什么？", "有没有可能，你的担心孩子也能感受到？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意尝试\"存在式陪伴\"", "找到一个具体的、小的改变", "对自己多一些接纳和耐心"],
    "guidance": ["如果不用说话，只是陪在孩子身边，你觉得可以吗？", "有没有一件很小的事，你可以试试看？", "你愿意先照顾好自己吗？"]
  }
}',
'{
  "key_messages": ["有时候，大人们很担心，但不知道怎么表达", "他们只是不知道怎么靠近你，不是不在乎", "你的感受是真实的，不需要解释"],
  "communication_opportunities": ["当孩子主动走出房间时", "当孩子愿意一起吃饭时", "当孩子有任何主动的表达时"],
  "inferred_feelings": ["可能感到被误解", "可能觉得很累", "可能不想成为别人的负担"]
}',
1),

-- 2. 不愿上学 / 厌学型
('school_refusal', '不愿上学 / 厌学型', '🏫', 'amber', '孩子抗拒上学、逃学、找借口不去学校',
'["每天早上起床困难", "找各种借口不去学校", "说身体不舒服但查不出问题", "一提上学就情绪激动", "周日晚上特别焦虑"]',
'["焦虑", "愤怒", "羞耻", "无奈", "崩溃"]',
'["理解厌学背后的真正原因", "避免道德评判", "帮助家长看到孩子的求助信号"]',
'【专属引导原则 - 不愿上学型】
这位父母的孩子正在抗拒上学。

核心策略：
- 厌学是结果，不是原因——帮助家长看到背后的困难
- 可能是学业压力、社交困难、师生关系、或家庭压力的累积
- 不要急于"让孩子回去上学"，先理解发生了什么
- 孩子不是"懒"，是"困"在某个地方

禁止事项：
- 不说"别的孩子都能上学"
- 不说"不上学以后怎么办"
- 不给家长施压"必须让孩子回去"
- 不把厌学等同于品德问题',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的焦虑和担心", "承认每天早上的崩溃感", "不再只看到\"孩子不去上学\"这个结果"],
    "guidance": ["每天早上是什么感觉？", "最让你崩溃的是哪个瞬间？", "你担心的是孩子的未来，还是现在？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["开始思考孩子为什么不想去", "看到可能的困难来源", "理解孩子也很痛苦"],
    "guidance": ["你觉得孩子在学校可能遇到了什么？", "如果孩子不是\"不想\"而是\"不能\"，你怎么看？", "孩子有没有说过什么，让你有一点点线索？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到逼迫可能让情况更糟", "发现自己的焦虑影响了互动", "愿意换一种方式"],
    "guidance": ["当孩子不去上学时，你们之间通常会发生什么？", "有没有试过不提上学，那时候孩子是什么状态？", "你觉得孩子能感受到你的焦虑吗？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意暂时放下\"必须上学\"的执念", "找到一个小的连接方式", "给自己和孩子一些喘息空间"],
    "guidance": ["如果这周不提上学的事，你能接受吗？", "有没有什么事情，是你们可以一起做的？", "你愿意先让孩子知道\"不管怎样我都爱你\"吗？"]
  }
}',
'{
  "key_messages": ["学校可能让你感到很累，这是真实的", "不想去不代表你有问题", "大人们可能不知道你在学校经历了什么"],
  "communication_opportunities": ["当孩子愿意说说学校的事时", "当孩子提到某个老师或同学时", "当孩子放松下来的时候"],
  "inferred_feelings": ["可能在学校有不好的经历", "可能感到很大的压力", "可能害怕让父母失望"]
}',
2),

-- 3. 网瘾/手机依赖型
('screen_addiction', '网瘾 / 手机依赖型', '📱', 'violet', '孩子沉迷手机游戏、无法自控',
'["手机不离手", "一收手机就发脾气", "熬夜玩游戏", "不和家人交流只看手机", "影响学习和生活"]',
'["愤怒", "无力", "焦虑", "困惑", "失控感"]',
'["理解手机是症状不是病因", "帮助家长看到孩子在虚拟世界寻找什么", "避免简单粗暴的控制"]',
'【专属引导原则 - 网瘾/手机依赖型】
这位父母的孩子可能沉迷于手机或游戏。

核心策略：
- 手机/游戏是孩子的"避风港"——帮助家长理解孩子在里面找什么
- 可能是成就感、社交、逃避压力、或控制感
- 单纯收手机只会激化冲突，不会解决问题
- 需要找到替代性的满足方式

禁止事项：
- 不建议"直接没收手机"
- 不说"玩物丧志"
- 不把孩子等同于"网瘾少年"
- 不用恐吓的方式（如"再玩眼睛瞎了"）',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的愤怒和无力", "承认冲突带来的疲惫", "不再只看到\"孩子玩手机\"这个行为"],
    "guidance": ["看到孩子一直玩手机，你最强烈的感受是什么？", "你们因为手机吵过架吗？那时候是什么感觉？", "有没有一瞬间，你觉得自己管不了了？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["开始思考孩子在手机里找什么", "看到可能的需求（成就感、社交、逃避）", "理解这不只是\"贪玩\""],
    "guidance": ["你觉得孩子在游戏/手机里得到了什么？", "现实中有什么是孩子得不到的吗？", "如果手机是一个\"避风港\"，孩子可能在躲什么？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到强制收手机可能适得其反", "发现冲突模式", "愿意尝试理解"],
    "guidance": ["收手机之后，通常会发生什么？", "有没有不吵架的时候？那时候你们在做什么？", "你觉得孩子知道你是担心他，还是觉得你在控制他？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意换一种方式", "找到一个可以一起做的事", "建立新的连接点"],
    "guidance": ["有没有什么事情，是可以替代手机的？", "你愿意先不提手机的事，找个机会和孩子聊聊天吗？", "有没有孩子感兴趣的事，你们可以一起做？"]
  }
}',
'{
  "key_messages": ["手机和游戏可能是你放松的方式", "大人们可能不理解你在里面找什么", "如果现实让你感到累，想躲一躲是正常的"],
  "communication_opportunities": ["当孩子主动放下手机时", "当孩子分享游戏内容时", "当孩子愿意一起做其他事时"],
  "inferred_feelings": ["可能在虚拟世界找成就感", "可能通过游戏社交", "可能在逃避某些压力"]
}',
3),

-- 4. 叛逆/对抗型
('rebellion', '叛逆 / 对抗型', '💥', 'red', '孩子顶嘴、对抗、不服管教',
'["说什么都顶嘴", "越说越反着来", "摔门、大吼", "不尊重父母", "觉得自己永远是对的"]',
'["愤怒", "受伤", "失控", "心寒", "委屈"]',
'["叛逆是独立的前奏", "帮助家长看到权力斗争的模式", "从控制转向尊重"]',
'【专属引导原则 - 叛逆/对抗型】
这位父母的孩子正处于对抗期。

核心策略：
- 叛逆是孩子在争取"我是谁"的主权——这是成长的必经之路
- 对抗的本质是权力斗争——谁也不想输
- 需要从"我说你听"转向"我们商量"
- 给孩子适当的选择权和控制感

禁止事项：
- 不说"我是为你好"
- 不说"你怎么这么不懂事"
- 不用权威压制
- 不翻旧账',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的愤怒和受伤", "承认冲突中的失控感", "看到自己也有情绪"],
    "guidance": ["和孩子吵架的时候，你最受不了的是什么？", "有没有觉得心寒的时刻？", "吵完之后，你是什么感觉？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解叛逆是争取独立", "看到孩子可能的需求", "不再只看到\"不听话\""],
    "guidance": ["你觉得孩子在争什么？", "如果叛逆是在说\"我想自己做主\"，你怎么看？", "孩子有没有哪些事情，其实他做得还不错？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到这是权力斗争", "发现自己的应对模式", "愿意放下\"我必须赢\""],
    "guidance": ["你们吵架的时候，通常是谁先让步？", "有没有发现一个模式：你越说，他越反？", "如果不是\"谁听谁的\"，还能怎么样？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意给孩子选择权", "找到一个可以商量的事", "从控制转向尊重"],
    "guidance": ["有没有什么事，可以让孩子自己决定？", "你愿意试试\"我们商量一下\"吗？", "有没有可能，先承认孩子有些想法是对的？"]
  }
}',
'{
  "key_messages": ["想要自己做主是很正常的", "大人们可能不知道怎么尊重你的想法", "你的意见是重要的"],
  "communication_opportunities": ["当孩子冷静下来时", "当孩子有自己的想法时", "当孩子做了一件事想分享时"],
  "inferred_feelings": ["可能觉得不被尊重", "可能想要更多自主权", "可能觉得总是被否定"]
}',
4),

-- 5. 自卑/内向型
('low_confidence', '自卑 / 内向型', '🐚', 'cyan', '孩子不自信、社交退缩、不敢表达',
'["不敢在人前说话", "总说自己不行", "不愿意交朋友", "害怕尝试新事物", "被批评就崩溃"]',
'["心疼", "焦虑", "无力", "着急", "自责"]',
'["接纳而非改造", "帮助家长看到内向不是缺陷", "建立安全的表达环境"]',
'【专属引导原则 - 自卑/内向型】
这位父母的孩子可能比较内向或缺乏自信。

核心策略：
- 内向不是缺陷——帮助家长重新定义"好孩子"
- 自卑可能来自过多的否定或过高的期望
- 需要的不是"胆子大一点"，而是被接纳的安全感
- 每个小小的勇敢都值得被看见

禁止事项：
- 不说"你怎么这么胆小"
- 不说"别的孩子都可以"
- 不强迫社交
- 不当众批评或比较',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的心疼和焦虑", "承认自己有时候很着急", "看到自己对孩子的期望"],
    "guidance": ["看到孩子不敢表达，你是什么感觉？心疼多还是着急多？", "你担心孩子以后会怎样吗？", "有没有自责过？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解内向不等于有问题", "看到孩子的优点", "发现孩子的勇敢时刻"],
    "guidance": ["你觉得孩子有什么优点？", "有没有哪个时刻，孩子其实挺勇敢的？", "如果内向是一种性格而不是缺点，你怎么看？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到催促可能让孩子更退缩", "发现比较带来的伤害", "愿意调整期望"],
    "guidance": ["你有没有说过\"别的孩子都可以\"？", "孩子被催的时候是什么反应？", "有没有可能，孩子怕让你失望？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意接纳孩子的节奏", "找到一个可以肯定的点", "创造安全的表达环境"],
    "guidance": ["有没有什么事，是孩子做得好的，你可以告诉他？", "你愿意让孩子知道\"慢一点也没关系\"吗？", "有没有一个安全的环境，让孩子可以练习表达？"]
  }
}',
'{
  "key_messages": ["不想说话也是可以的", "你不需要像别人一样", "有些人天生就喜欢安静一些"],
  "communication_opportunities": ["当孩子在小范围内表达时", "当孩子完成一件小事时", "当孩子和家人在一起放松时"],
  "inferred_feelings": ["可能害怕被评判", "可能觉得自己不够好", "可能需要更多的安全感"]
}',
5),

-- 6. 学习焦虑型
('learning_anxiety', '学习焦虑型', '📚', 'orange', '孩子对学习过度焦虑、完美主义、考试恐惧',
'["一考试就紧张", "作业写到很晚", "害怕出错", "成绩下降就崩溃", "给自己压力很大"]',
'["心疼", "焦虑", "无力", "困惑", "也跟着紧张"]',
'["区分健康的努力和焦虑", "帮助家长反思家庭对成绩的态度", "建立成长型思维"]',
'【专属引导原则 - 学习焦虑型】
这位父母的孩子对学习有过度的焦虑。

核心策略：
- 学习焦虑可能来自过高的期望（自己的或家长的）
- 帮助家长反思：我们家对成绩的态度是什么？
- 从"结果导向"转向"过程导向"
- 允许犯错，强调成长

禁止事项：
- 不说"这有什么好紧张的"
- 不说"你已经很优秀了"（可能增加压力）
- 不增加额外的期望
- 不把成绩和爱挂钩',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的心疼", "看到孩子的压力", "反思自己是否也焦虑"],
    "guidance": ["看到孩子那么紧张，你是什么感觉？", "你觉得孩子的压力主要来自哪里？", "你自己会因为孩子的成绩焦虑吗？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解焦虑背后可能是怕让人失望", "看到家庭对成绩的态度的影响", "发现孩子的努力"],
    "guidance": ["你觉得孩子害怕的是考不好，还是让人失望？", "在你们家，成绩意味着什么？", "孩子其实已经很努力了，你看到了吗？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到自己的反应影响孩子", "发现无意中增加压力的方式", "愿意调整"],
    "guidance": ["孩子考得不好的时候，你们会说什么？", "有没有可能，孩子觉得成绩好你才开心？", "你希望孩子知道什么？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意降低对成绩的关注", "找到一个释放压力的方式", "让孩子感受到无条件的爱"],
    "guidance": ["有没有什么话，你想让孩子知道？", "这周可以少问一次成绩吗？", "有没有什么事，可以让孩子放松一下？"]
  }
}',
'{
  "key_messages": ["考试只是一个测试，不是对你这个人的评价", "犯错是学习的一部分", "你已经很努力了"],
  "communication_opportunities": ["当孩子考完试回来时", "当孩子愿意说说学校的事时", "当孩子放松的时候"],
  "inferred_feelings": ["可能害怕让父母失望", "可能给自己太大压力", "可能需要被肯定的不只是成绩"]
}',
6),

-- 7. 社交冲突型
('social_conflict', '社交冲突型', '👥', 'pink', '孩子被孤立、被欺负、人际关系困难',
'["在学校没有朋友", "被同学排挤", "回来情绪很差", "不想去学校", "被欺负不敢说"]',
'["心疼", "愤怒", "无力", "想帮又不知道怎么帮", "担心"]',
'["倾听而非立刻行动", "帮助家长成为安全的倾诉对象", "谨慎介入"]',
'【专属引导原则 - 社交冲突型】
这位父母的孩子可能在学校遇到社交困难。

核心策略：
- 孩子可能害怕说出来会让情况更糟
- 家长需要先成为"安全的倾诉对象"
- 不要急于"解决问题"，先让孩子感到被理解
- 谨慎介入，避免让孩子更难堪

禁止事项：
- 不说"你怎么不反抗"
- 不说"为什么别人就欺负你"
- 不未经允许去学校投诉
- 不说"忍一忍就过去了"',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的心疼和愤怒", "承认想帮又不知道怎么帮的无力", "看到自己也很痛苦"],
    "guidance": ["知道孩子在学校的情况，你是什么感受？", "最让你难受的是什么？", "你有没有觉得很无力？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解孩子为什么不敢说", "看到孩子的处境", "不归咎于孩子"],
    "guidance": ["你觉得孩子为什么不愿意说？", "孩子可能害怕什么？", "如果孩子怕说出来会更糟，你怎么看？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到急于行动可能让孩子更难", "发现孩子需要的可能是被理解", "愿意先倾听"],
    "guidance": ["你有没有想过去学校找老师？孩子知道吗？", "孩子需要的是你帮他解决，还是有人理解他？", "如果先不行动，只是陪着他，可以吗？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意先成为安全的倾诉对象", "找到一个让孩子感到被支持的方式", "和孩子一起商量下一步"],
    "guidance": ["你愿意先让孩子知道\"不管怎样我都站在你这边\"吗？", "有没有什么话，可以让孩子更愿意和你说？", "如果要做什么，你愿意和孩子商量吗？"]
  }
}',
'{
  "key_messages": ["被人欺负不是你的错", "你不需要一个人扛着", "说出来不一定会更糟"],
  "communication_opportunities": ["当孩子从学校回来时", "当孩子情绪不好时", "当孩子主动提到同学时"],
  "inferred_feelings": ["可能觉得很孤独", "可能害怕说出来会更糟", "可能觉得没人能帮自己"]
}',
7),

-- 8. 家长情绪失控型
('parent_explosion', '家长情绪失控型', '🌋', 'rose', '家长自己容易情绪失控、对孩子发火',
'["控制不住对孩子发火", "事后很后悔", "吼完孩子更不听", "觉得自己不是好父母", "童年阴影重演"]',
'["自责", "内疚", "失控", "绝望", "害怕"]',
'["先关注家长自己的情绪", "理解情绪失控的来源", "打破代际传递"]',
'【专属引导原则 - 家长情绪失控型】
这位家长正在为自己的情绪失控困扰。

核心策略：
- 这是最需要先关注家长自己的类型
- 情绪失控往往有更深的来源（压力、童年、创伤）
- 不是"我要控制情绪"，而是"我为什么会这样"
- 先自我接纳，才能改变

禁止事项：
- 不说"你要控制自己"
- 不说"对孩子发火多不好"
- 不增加自责
- 不讲道理',
'{
  "stage_1": {
    "name": "觉察",
    "success_criteria": ["说出自己的自责和内疚", "描述失控的感受", "愿意看看发生了什么"],
    "guidance": ["发完火之后，你是什么感觉？", "那个瞬间，是什么让你爆发的？", "你觉得自己怎么了？"]
  },
  "stage_2": {
    "name": "看见",
    "success_criteria": ["理解失控有原因", "看到可能的压力来源", "对自己多一点理解"],
    "guidance": ["除了孩子，最近还有什么让你很累的事吗？", "你小时候，大人是怎么对你的？", "你觉得自己一直在扛着什么？"]
  },
  "stage_3": {
    "name": "反应",
    "success_criteria": ["意识到这是积累的爆发", "发现自己需要被照顾", "不再只是自责"],
    "guidance": ["你有没有觉得，其实自己也很需要有人理解？", "除了发火，你还能怎么释放？", "有没有人可以帮帮你？"]
  },
  "stage_4": {
    "name": "转化",
    "success_criteria": ["愿意先照顾自己", "找到一个喘息的方式", "对自己多一些接纳"],
    "guidance": ["有没有什么事，可以让你休息一下？", "你愿意对自己说一句\"我已经很努力了\"吗？", "有没有一件很小的事，可以让你喘口气？"]
  }
}',
'{
  "key_messages": ["大人们有时候也会崩溃", "他们可能自己也很累", "发脾气不代表不爱你"],
  "communication_opportunities": ["当家长冷静下来后", "当家长主动道歉时", "当气氛缓和的时候"],
  "inferred_feelings": ["可能知道父母很辛苦", "可能也害怕冲突", "可能希望家里气氛好一些"]
}',
8);
