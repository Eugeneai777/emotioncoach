-- 为 og_configurations 表添加 category_id 字段用于手动分类
ALTER TABLE og_configurations 
ADD COLUMN IF NOT EXISTS category_id text DEFAULT NULL;

COMMENT ON COLUMN og_configurations.category_id IS '手动指定的分类ID，优先于自动关键词匹配';