
-- 风险内容监控表
CREATE TABLE public.monitor_risk_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 内容来源
  content_source TEXT NOT NULL, -- 'community_post', 'post_comment', 'profile', 'appointment_review', 'ai_conversation', 'camp_declaration'
  source_id TEXT, -- 关联的原始记录 ID
  source_detail TEXT, -- 来源补充信息（如帖子标题、教练名等）
  -- 内容
  content_text TEXT NOT NULL,
  content_preview TEXT, -- 截取前 200 字的预览
  -- 检测结果
  risk_type TEXT NOT NULL, -- 'sensitive_word', 'political', 'pornography', 'violence', 'fraud', 'self_harm', 'advertising', 'personal_info_leak', 'other'
  risk_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  risk_keywords TEXT[], -- 命中的关键词
  risk_score NUMERIC(5,2), -- AI 检测置信度 0-100
  detection_method TEXT DEFAULT 'keyword', -- 'keyword', 'ai', 'manual_report'
  -- 用户信息
  user_id UUID,
  user_display_name TEXT,
  -- 审核
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'dismissed', 'auto_blocked'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  action_taken TEXT, -- 'none', 'content_deleted', 'user_warned', 'user_banned'
  -- 告警
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMPTZ,
  -- 元信息
  platform TEXT, -- 'web', 'wechat', 'mini_program'
  page TEXT, -- 触发页面
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_monitor_risk_content_status ON public.monitor_risk_content(status);
CREATE INDEX idx_monitor_risk_content_risk_level ON public.monitor_risk_content(risk_level);
CREATE INDEX idx_monitor_risk_content_created_at ON public.monitor_risk_content(created_at DESC);
CREATE INDEX idx_monitor_risk_content_user_id ON public.monitor_risk_content(user_id);
CREATE INDEX idx_monitor_risk_content_source ON public.monitor_risk_content(content_source);

-- RLS
ALTER TABLE public.monitor_risk_content ENABLE ROW LEVEL SECURITY;

-- 仅管理员可读写
CREATE POLICY "Admins can manage risk content" ON public.monitor_risk_content
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- service_role 完全访问（Edge Functions 写入）
CREATE POLICY "Service role full access on risk content" ON public.monitor_risk_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 自动更新 updated_at
CREATE TRIGGER update_monitor_risk_content_updated_at
  BEFORE UPDATE ON public.monitor_risk_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 30 天自动清理函数（与其他监控表一致）
-- 已 dismissed 的记录 30 天后自动清除，confirmed 的保留 90 天
