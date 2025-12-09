-- Add default entry type configuration to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS default_entry_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS default_entry_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_quota_amount integer DEFAULT 10;

-- Add comment for clarity
COMMENT ON COLUMN partners.default_entry_type IS 'Partner default entry type: free or paid';
COMMENT ON COLUMN partners.default_entry_price IS 'Entry price: 0 for free, 9.9 for paid';
COMMENT ON COLUMN partners.default_quota_amount IS 'Quota amount: 10 for free, 50 for paid';