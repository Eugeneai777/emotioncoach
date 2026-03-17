-- Unique index on phone+country_code for non-deleted profiles to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique 
ON public.profiles (phone_country_code, phone) 
WHERE phone IS NOT NULL AND deleted_at IS NULL;