ALTER TABLE public.partner_invitations DROP CONSTRAINT valid_status;

ALTER TABLE public.partner_invitations ADD CONSTRAINT valid_status CHECK (status = ANY (ARRAY['pending'::text, 'claimed'::text, 'expired'::text, 'skipped'::text]));