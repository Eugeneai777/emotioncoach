-- 给 coach_templates 表添加 stage_prompts JSONB 字段用于存储阶段性提示词
ALTER TABLE public.coach_templates 
ADD COLUMN IF NOT EXISTS stage_prompts JSONB DEFAULT NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.coach_templates.stage_prompts IS '阶段性提示词配置，包含 coaching_techniques、question_templates 和各阶段 stages (0-5) 的提示词';