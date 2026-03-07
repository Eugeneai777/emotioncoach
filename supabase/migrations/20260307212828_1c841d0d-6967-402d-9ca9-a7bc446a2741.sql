
-- Partner follow-up reminder settings
CREATE TABLE IF NOT EXISTS public.partner_followup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  inactive_days_threshold integer DEFAULT 7,
  reminder_channels text[] DEFAULT ARRAY['in_app'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE public.partner_followup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage own followup settings" ON public.partner_followup_settings
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all followup settings" ON public.partner_followup_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Partner followup reminder logs
CREATE TABLE IF NOT EXISTS public.partner_followup_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  student_name text,
  inactive_days integer NOT NULL,
  reminder_type text DEFAULT 'inactive_student',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.partner_followup_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own reminders" ON public.partner_followup_reminders
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can update own reminders" ON public.partner_followup_reminders
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert reminders" ON public.partner_followup_reminders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Partner training resources
CREATE TABLE IF NOT EXISTS public.partner_training_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'guide',
  content text,
  content_type text DEFAULT 'markdown',
  tags text[] DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.partner_training_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read published resources" ON public.partner_training_resources
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all resources" ON public.partner_training_resources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
