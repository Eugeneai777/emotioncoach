
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  wecom_webhook_url TEXT NOT NULL,
  alert_levels TEXT[] NOT NULL DEFAULT '{critical}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage emergency contacts
CREATE POLICY "Admins can manage emergency contacts"
  ON public.emergency_contacts
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
