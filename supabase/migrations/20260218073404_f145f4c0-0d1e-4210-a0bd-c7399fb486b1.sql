
-- Create RPC function for phone existence check (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_phone_exists(
  p_phone TEXT,
  p_country_code TEXT DEFAULT '+86'
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone = p_phone
      AND phone_country_code = p_country_code
      AND deleted_at IS NULL
  );
$$;

-- Grant execute to anon and authenticated so it works during registration
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT, TEXT) TO authenticated;
