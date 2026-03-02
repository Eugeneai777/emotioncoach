
-- Drop conflicting insert policies
DROP POLICY IF EXISTS "Authenticated users can insert OG health records" ON public.monitor_og_health;
DROP POLICY IF EXISTS "Anon users can insert OG health records" ON public.monitor_og_health;

-- Single permissive insert policy for all users (monitoring data is non-sensitive)
CREATE POLICY "Anyone can insert OG health records"
  ON public.monitor_og_health FOR INSERT
  WITH CHECK (true);
