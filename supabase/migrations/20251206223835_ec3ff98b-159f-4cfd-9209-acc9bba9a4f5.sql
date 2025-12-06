
-- 用户反馈/建议表
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  feedback_type TEXT NOT NULL DEFAULT 'suggestion', -- suggestion, feature_request, improvement
  category TEXT, -- product, service, content, other
  content TEXT NOT NULL,
  contact_info TEXT, -- 可选的联系方式（未登录用户）
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, implemented, rejected
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 客服工单/投诉表
CREATE TABLE public.customer_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ticket_no TEXT NOT NULL UNIQUE,
  ticket_type TEXT NOT NULL DEFAULT 'complaint', -- complaint, issue, inquiry
  category TEXT, -- payment, feature, account, content, other
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  contact_info TEXT,
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 客服知识库表（FAQ、使用指南等静态内容）
CREATE TABLE public.support_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- faq, guide, policy, announcement
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[], -- 用于AI匹配的关键词
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 客服对话历史表
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL, -- 用于未登录用户的会话追踪
  messages JSONB DEFAULT '[]'::jsonb,
  ticket_id UUID REFERENCES public.customer_tickets(id),
  feedback_id UUID REFERENCES public.user_feedback(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- user_feedback 策略
CREATE POLICY "用户可以创建反馈" ON public.user_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "用户可以查看自己的反馈" ON public.user_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "管理员可以管理所有反馈" ON public.user_feedback
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- customer_tickets 策略
CREATE POLICY "用户可以创建工单" ON public.customer_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "用户可以查看自己的工单" ON public.customer_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "管理员可以管理所有工单" ON public.customer_tickets
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- support_knowledge_base 策略
CREATE POLICY "所有人可以查看激活的知识库" ON public.support_knowledge_base
  FOR SELECT USING (is_active = true);

CREATE POLICY "管理员可以管理知识库" ON public.support_knowledge_base
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- support_conversations 策略
CREATE POLICY "用户可以管理自己的对话" ON public.support_conversations
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "管理员可以查看所有对话" ON public.support_conversations
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 创建更新时间触发器
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_tickets_updated_at
  BEFORE UPDATE ON public.customer_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_knowledge_base_updated_at
  BEFORE UPDATE ON public.support_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 插入初始知识库内容
INSERT INTO public.support_knowledge_base (category, title, content, keywords, display_order) VALUES
('faq', '如何开始使用情绪教练？', '点击首页的"开始情绪梳理"按钮，跟随劲老师的引导，完成情绪四部曲（觉察→理解→反应→转化）即可生成你的情绪简报。', ARRAY['情绪教练', '使用', '开始', '入门'], 1),
('faq', '情绪按钮和情绪教练有什么区别？', '情绪按钮是即时的陪伴工具，适合情绪激动时快速平复（9种情绪，288条认知提醒）；情绪教练是深入的梳理工具，适合事后反思和成长。两者相辅相成。', ARRAY['情绪按钮', '情绪教练', '区别', '对比'], 2),
('faq', '如何购买会员套餐？', '进入"套餐"页面，选择适合你的套餐，点击购买按钮，使用微信扫码支付即可。支付成功后会自动到账。', ARRAY['购买', '会员', '套餐', '支付', '价格'], 3),
('faq', '训练营如何打卡？', '加入训练营后，每天完成一次情绪梳理（情绪教练对话）即可自动打卡。系统会记录你的连续天数和成长历程。', ARRAY['训练营', '打卡', '签到'], 4),
('guide', '情绪四部曲使用指南', '1️⃣觉察(Feel it)：感受并命名情绪\n2️⃣理解(Name it)：理解情绪背后的需求\n3️⃣反应(React it)：觉察应对模式\n4️⃣转化(Transform it)：选择温柔回应\n\n完成后系统会生成《情绪四部曲简报》总结你的成长。', ARRAY['四部曲', '教程', '指南', '使用方法'], 1),
('guide', '情绪按钮使用指南', '1. 选择当前情绪（9种可选）\n2. 进入4阶段疗愈流程\n3. 跟随32条认知提醒自我对话\n4. 可选呼吸练习和语音陪伴\n5. 完成后查看使用记录', ARRAY['情绪按钮', '使用', '教程'], 2),
('policy', '退款政策', '购买后7天内，如未使用任何付费功能，可申请全额退款。请联系客服提交退款申请。', ARRAY['退款', '退钱', '取消'], 1),
('policy', '隐私保护说明', '我们高度重视你的隐私安全。所有情绪记录仅对你本人可见，不会被分享或用于商业目的。你可以随时在设置中导出或删除个人数据。', ARRAY['隐私', '安全', '数据', '保护'], 2);
