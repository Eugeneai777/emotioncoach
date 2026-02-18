
-- =============================================
-- Step 1: Extend health_store_products table
-- =============================================
ALTER TABLE public.health_store_products
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN stock INTEGER NOT NULL DEFAULT -1,
ADD COLUMN sales_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN detail_images TEXT[],
ADD COLUMN shipping_info TEXT,
ADD COLUMN contact_info TEXT;

-- Index for partner lookup
CREATE INDEX idx_health_store_products_partner_id ON public.health_store_products(partner_id);

-- =============================================
-- Step 2: Create store_orders table
-- =============================================
CREATE TABLE public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL,
  product_id UUID REFERENCES public.health_store_products(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_address TEXT,
  tracking_number TEXT,
  payment_order_id UUID,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_store_orders_buyer_id ON public.store_orders(buyer_id);
CREATE INDEX idx_store_orders_partner_id ON public.store_orders(partner_id);
CREATE INDEX idx_store_orders_status ON public.store_orders(status);

-- Auto-update updated_at
CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Step 3: RLS for health_store_products
-- =============================================
-- Keep existing SELECT policy for anon/authenticated (is_available = true)
-- Add partner management policies

-- Partners can insert their own products
CREATE POLICY "Industry partners can insert own products"
  ON public.health_store_products FOR INSERT
  TO authenticated
  WITH CHECK (
    partner_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = health_store_products.partner_id
      AND partners.partner_type = 'industry'
      AND partners.user_id = auth.uid()
    )
  );

-- Partners can update their own products
CREATE POLICY "Industry partners can update own products"
  ON public.health_store_products FOR UPDATE
  TO authenticated
  USING (
    partner_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = health_store_products.partner_id
      AND partners.partner_type = 'industry'
      AND partners.user_id = auth.uid()
    )
  );

-- Partners can delete their own products
CREATE POLICY "Industry partners can delete own products"
  ON public.health_store_products FOR DELETE
  TO authenticated
  USING (
    partner_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = health_store_products.partner_id
      AND partners.partner_type = 'industry'
      AND partners.user_id = auth.uid()
    )
  );

-- Admins can manage all products
CREATE POLICY "Admins can manage all products"
  ON public.health_store_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Step 4: RLS for store_orders
-- =============================================
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
  ON public.store_orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Buyers can create orders
CREATE POLICY "Buyers can create orders"
  ON public.store_orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Partners can view orders for their products
CREATE POLICY "Partners can view own store orders"
  ON public.store_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = store_orders.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Partners can update orders (e.g., add tracking number, mark shipped)
CREATE POLICY "Partners can update own store orders"
  ON public.store_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = store_orders.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders"
  ON public.store_orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access for edge functions
CREATE POLICY "Service role full access on store_orders"
  ON public.store_orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
