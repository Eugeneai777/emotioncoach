-- Create partner_invitations table for batch import workflow
CREATE TABLE public.partner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT NOT NULL UNIQUE,
  partner_type TEXT NOT NULL DEFAULT 'bloom',
  invitee_name TEXT,
  invitee_phone TEXT,
  order_amount NUMERIC NOT NULL DEFAULT 19800,
  status TEXT NOT NULL DEFAULT 'pending',
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'claimed', 'expired'))
);

-- Create index for fast lookup by invite_code
CREATE INDEX idx_partner_invitations_invite_code ON public.partner_invitations(invite_code);
CREATE INDEX idx_partner_invitations_status ON public.partner_invitations(status);
CREATE INDEX idx_partner_invitations_partner_type ON public.partner_invitations(partner_type);

-- Enable RLS
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all invitations"
ON public.partner_invitations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Public can read pending invitations by code (for claim page)
CREATE POLICY "Anyone can read pending invitations by code"
ON public.partner_invitations
FOR SELECT
USING (status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_partner_invitations_updated_at
BEFORE UPDATE ON public.partner_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();