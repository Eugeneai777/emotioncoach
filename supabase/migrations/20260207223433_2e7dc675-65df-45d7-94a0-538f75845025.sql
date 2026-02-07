
-- 添加 partner_expires_at 列
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS partner_expires_at TIMESTAMPTZ;

-- 数据迁移：将现有有劲合伙人的 prepurchase_expires_at 复制到 partner_expires_at
UPDATE public.partners 
SET partner_expires_at = prepurchase_expires_at 
WHERE partner_type = 'youjin' 
  AND prepurchase_expires_at IS NOT NULL 
  AND partner_expires_at IS NULL;

-- 添加注释
COMMENT ON COLUMN public.partners.partner_expires_at IS '合伙人资格到期时间，null 表示永久（绽放合伙人）';
