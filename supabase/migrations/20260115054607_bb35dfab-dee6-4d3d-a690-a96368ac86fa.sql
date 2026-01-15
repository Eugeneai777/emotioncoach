-- 为 alive_check_logs 添加 AI 见证和觉察维度字段
ALTER TABLE public.alive_check_logs
ADD COLUMN ai_witness TEXT,
ADD COLUMN awakening_type TEXT;

COMMENT ON COLUMN public.alive_check_logs.ai_witness IS 'AI 生成的存活见证语';
COMMENT ON COLUMN public.alive_check_logs.awakening_type IS '用户选择的觉察维度';