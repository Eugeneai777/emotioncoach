CREATE TABLE public.admin_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  note text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notes" ON public.admin_user_notes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notes" ON public.admin_user_notes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notes" ON public.admin_user_notes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notes" ON public.admin_user_notes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_user_notes_updated_at
  BEFORE UPDATE ON public.admin_user_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_admin_user_notes_user_id ON public.admin_user_notes(user_id);