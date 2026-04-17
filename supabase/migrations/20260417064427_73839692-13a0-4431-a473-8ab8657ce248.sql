ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quota_credited_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_quota_credited_at ON public.orders(quota_credited_at) WHERE quota_credited_at IS NULL;
-- Backfill: mark all currently paid orders as already credited so the new idempotency check doesn't double-credit historical orders
UPDATE public.orders SET quota_credited_at = COALESCE(paid_at, updated_at, created_at, NOW()) WHERE status = 'paid' AND quota_credited_at IS NULL;