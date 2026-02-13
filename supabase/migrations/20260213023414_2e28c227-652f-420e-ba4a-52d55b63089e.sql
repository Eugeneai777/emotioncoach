
-- Add industry partner fields to partners table
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS cooperation_note TEXT,
  ADD COLUMN IF NOT EXISTS custom_commission_rate_l1 NUMERIC,
  ADD COLUMN IF NOT EXISTS custom_commission_rate_l2 NUMERIC;

-- Add comment for clarity
COMMENT ON COLUMN public.partners.company_name IS '行业合伙人-公司/机构名称';
COMMENT ON COLUMN public.partners.contact_person IS '行业合伙人-联系人';
COMMENT ON COLUMN public.partners.contact_phone IS '行业合伙人-联系电话';
COMMENT ON COLUMN public.partners.cooperation_note IS '行业合伙人-合作备注';
COMMENT ON COLUMN public.partners.custom_commission_rate_l1 IS '行业合伙人-自定义一级佣金比例(覆盖默认)';
COMMENT ON COLUMN public.partners.custom_commission_rate_l2 IS '行业合伙人-自定义二级佣金比例(覆盖默认)';
