-- Allow public read of approved active coach profiles via base table (security_invoker view inherits this)
CREATE POLICY "Public can view active approved coaches"
ON public.human_coaches
FOR SELECT
USING (status IN ('approved','active') AND is_accepting_new = true);

-- Ensure the safe view itself is reachable through the Data API
GRANT SELECT ON public.human_coaches_public TO anon, authenticated;