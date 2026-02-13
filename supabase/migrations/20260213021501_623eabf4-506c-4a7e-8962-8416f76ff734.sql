
-- 1. campaigns 表增加 partner_id
ALTER TABLE public.campaigns ADD COLUMN partner_id uuid REFERENCES public.partners(id);

-- 2. 新建 partner_products 表
CREATE TABLE public.partner_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_key text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. partner_products 索引
CREATE INDEX idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX idx_campaigns_partner_id ON public.campaigns(partner_id);

-- 4. partner_products 更新时间触发器
CREATE TRIGGER update_partner_products_updated_at
  BEFORE UPDATE ON public.partner_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS on partner_products
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

-- 6. RLS: partner_products - 合伙人管理自己的产品，管理员全部
CREATE POLICY "Partners manage own products"
  ON public.partner_products FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners insert own products"
  ON public.partner_products FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners update own products"
  ON public.partner_products FOR UPDATE TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners delete own products"
  ON public.partner_products FOR DELETE TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 7. 调整 campaigns RLS - 增加合伙人可操作自己的 campaigns
-- 先检查是否需要添加新策略（合伙人维度）
CREATE POLICY "Partners view own campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (
    partner_id IS NULL
    OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners insert own campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners update own campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Partners delete own campaigns"
  ON public.campaigns FOR DELETE TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
