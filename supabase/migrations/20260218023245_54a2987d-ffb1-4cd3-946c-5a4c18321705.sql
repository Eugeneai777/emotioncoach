ALTER TABLE public.health_store_products
  ADD COLUMN youjin_commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN youjin_commission_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN bloom_commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN bloom_commission_rate numeric NOT NULL DEFAULT 0;