-- 添加 history_label_short 字段
ALTER TABLE public.coach_templates 
ADD COLUMN IF NOT EXISTS history_label_short text;

-- 为现有教练模板设置默认值
UPDATE public.coach_templates 
SET history_label_short = '日记' 
WHERE history_label_short IS NULL;

-- 添加字段注释
COMMENT ON COLUMN public.coach_templates.history_label_short 
IS '移动端按钮短文字标签（如：日记）';