-- 添加时区字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT DEFAULT 'Asia/Shanghai';

-- 添加注释说明
COMMENT ON COLUMN public.profiles.timezone IS '用户时区设置，默认为中国标准时间 Asia/Shanghai';