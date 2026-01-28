-- 创建合伙人产品佣金配置表
CREATE TABLE public.partner_product_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_level_rule_id UUID REFERENCES public.partner_level_rules(id) ON DELETE CASCADE NOT NULL,
  package_key TEXT NOT NULL,
  commission_rate_l1 DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  commission_rate_l2 DECIMAL(5,4) NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_level_rule_id, package_key)
);

-- 添加表注释
COMMENT ON TABLE public.partner_product_commissions IS '合伙人产品级佣金配置表，用于为不同等级的合伙人设置不同产品的佣金率';
COMMENT ON COLUMN public.partner_product_commissions.partner_level_rule_id IS '关联的合伙人等级规则ID';
COMMENT ON COLUMN public.partner_product_commissions.package_key IS '产品标识键，对应packages表的package_key';
COMMENT ON COLUMN public.partner_product_commissions.commission_rate_l1 IS '一级分成比例';
COMMENT ON COLUMN public.partner_product_commissions.commission_rate_l2 IS '二级分成比例';
COMMENT ON COLUMN public.partner_product_commissions.is_enabled IS '是否启用该产品的分成';

-- 启用RLS
ALTER TABLE public.partner_product_commissions ENABLE ROW LEVEL SECURITY;

-- 管理员可以完全访问
CREATE POLICY "Admins can manage partner_product_commissions"
ON public.partner_product_commissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 创建更新时间触发器
CREATE TRIGGER update_partner_product_commissions_updated_at
BEFORE UPDATE ON public.partner_product_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 为现有有劲合伙人等级初始化默认产品配置
INSERT INTO public.partner_product_commissions (partner_level_rule_id, package_key, commission_rate_l1, commission_rate_l2, is_enabled)
SELECT 
  plr.id,
  p.package_key,
  plr.commission_rate_l1,
  plr.commission_rate_l2,
  true
FROM public.partner_level_rules plr
CROSS JOIN public.packages p
WHERE plr.partner_type = 'youjin' 
  AND plr.is_active = true
  AND p.product_line = 'youjin'
  AND p.is_active = true
ON CONFLICT (partner_level_rule_id, package_key) DO NOTHING;