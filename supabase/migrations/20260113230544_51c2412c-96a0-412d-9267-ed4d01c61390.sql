-- 添加 OG 图片尺寸字段到 og_configurations 表
ALTER TABLE public.og_configurations 
ADD COLUMN IF NOT EXISTS image_width integer DEFAULT 1200,
ADD COLUMN IF NOT EXISTS image_height integer DEFAULT 630;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.og_configurations.image_width IS 'OG图片宽度，默认1200px，用于og:image:width声明';
COMMENT ON COLUMN public.og_configurations.image_height IS 'OG图片高度，默认630px，用于og:image:height声明';