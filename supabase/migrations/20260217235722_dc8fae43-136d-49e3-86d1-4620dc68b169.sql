
-- Create health_store_products table
CREATE TABLE public.health_store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image_url TEXT,
  mini_program_path TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_store_products ENABLE ROW LEVEL SECURITY;

-- Public read for available products
CREATE POLICY "Anyone can view available products"
ON public.health_store_products
FOR SELECT
USING (is_available = true);

-- Admin write access
CREATE POLICY "Admins can manage products"
ON public.health_store_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
