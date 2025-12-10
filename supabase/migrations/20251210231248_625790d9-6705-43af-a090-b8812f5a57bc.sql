-- 添加文档类型和关联字段到知识库表
ALTER TABLE support_knowledge_base 
ADD COLUMN IF NOT EXISTS doc_type text DEFAULT 'faq',
ADD COLUMN IF NOT EXISTS coach_key text,
ADD COLUMN IF NOT EXISTS camp_type text;

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_kb_doc_type ON support_knowledge_base(doc_type);
CREATE INDEX IF NOT EXISTS idx_kb_coach_key ON support_knowledge_base(coach_key);
CREATE INDEX IF NOT EXISTS idx_kb_camp_type ON support_knowledge_base(camp_type);