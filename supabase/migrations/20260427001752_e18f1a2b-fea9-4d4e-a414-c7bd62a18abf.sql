CREATE TABLE IF NOT EXISTS public.marketing_product_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC,
  category TEXT NOT NULL DEFAULT '其他',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_gift_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  product_name TEXT NOT NULL,
  gift_display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'assessments',
  route TEXT,
  topic_id TEXT,
  product_id TEXT,
  report_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_product_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_gift_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active marketing products" ON public.marketing_product_pool;
CREATE POLICY "Anyone can view active marketing products"
ON public.marketing_product_pool
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert marketing products" ON public.marketing_product_pool;
CREATE POLICY "Admins can insert marketing products"
ON public.marketing_product_pool
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update marketing products" ON public.marketing_product_pool;
CREATE POLICY "Admins can update marketing products"
ON public.marketing_product_pool
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete marketing products" ON public.marketing_product_pool;
CREATE POLICY "Admins can delete marketing products"
ON public.marketing_product_pool
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view active marketing gifts" ON public.marketing_gift_pool;
CREATE POLICY "Anyone can view active marketing gifts"
ON public.marketing_gift_pool
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert marketing gifts" ON public.marketing_gift_pool;
CREATE POLICY "Admins can insert marketing gifts"
ON public.marketing_gift_pool
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update marketing gifts" ON public.marketing_gift_pool;
CREATE POLICY "Admins can update marketing gifts"
ON public.marketing_gift_pool
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete marketing gifts" ON public.marketing_gift_pool;
CREATE POLICY "Admins can delete marketing gifts"
ON public.marketing_gift_pool
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_marketing_product_pool_updated_at ON public.marketing_product_pool;
CREATE TRIGGER update_marketing_product_pool_updated_at
BEFORE UPDATE ON public.marketing_product_pool
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_gift_pool_updated_at ON public.marketing_gift_pool;
CREATE TRIGGER update_marketing_gift_pool_updated_at
BEFORE UPDATE ON public.marketing_gift_pool
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_marketing_product_pool_active_order ON public.marketing_product_pool (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_marketing_gift_pool_active_order ON public.marketing_gift_pool (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_marketing_gift_pool_product_id ON public.marketing_gift_pool (product_id);
CREATE INDEX IF NOT EXISTS idx_marketing_gift_pool_topic_id ON public.marketing_gift_pool (topic_id);