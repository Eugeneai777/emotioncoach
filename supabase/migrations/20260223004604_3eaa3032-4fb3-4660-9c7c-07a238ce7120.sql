-- Allow anyone to read basic partner info for pay-entry and claim pages
CREATE POLICY "任何人可以查看合伙人基本信息"
ON public.partners
FOR SELECT
USING (status = 'active');
