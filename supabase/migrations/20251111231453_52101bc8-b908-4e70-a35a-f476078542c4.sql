-- 为profiles表添加情绪伙伴和对话风格字段
ALTER TABLE public.profiles 
ADD COLUMN companion_type TEXT DEFAULT 'jing_teacher',
ADD COLUMN conversation_style TEXT DEFAULT 'gentle';

-- 添加约束确保只能选择预定义的值
ALTER TABLE public.profiles 
ADD CONSTRAINT companion_type_check CHECK (companion_type IN ('jing_teacher', 'little_sprout', 'starlight', 'calm_breeze', 'wise_owl')),
ADD CONSTRAINT conversation_style_check CHECK (conversation_style IN ('gentle', 'encouraging', 'analytical', 'playful', 'profound'));

COMMENT ON COLUMN public.profiles.companion_type IS '情绪伙伴类型：jing_teacher(劲老师), little_sprout(小树苗), starlight(小星星), calm_breeze(微风), wise_owl(智慧猫头鹰)';
COMMENT ON COLUMN public.profiles.conversation_style IS '对话风格：gentle(温柔), encouraging(鼓励), analytical(分析), playful(活泼), profound(深刻)';
