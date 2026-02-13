
-- Step 1: Make user_id nullable for industry partners
ALTER TABLE public.partners ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop the existing unique constraint on user_id
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_user_id_key;

-- Step 3: Create partial unique index (only for non-null user_id)
CREATE UNIQUE INDEX IF NOT EXISTS partners_user_id_unique ON public.partners (user_id) WHERE user_id IS NOT NULL;

-- Step 4: Add industry partner specific fields
ALTER TABLE public.partners 
  ADD COLUMN IF NOT EXISTS custom_product_packages JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS traffic_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS settlement_cycle TEXT DEFAULT NULL;
