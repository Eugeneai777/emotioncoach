-- Create table for tracking camp invite referrals (different from partner referrals)
CREATE TABLE IF NOT EXISTS public.camp_invite_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  camp_type TEXT NOT NULL DEFAULT 'wealth_block_21',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, joined, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  camp_id UUID REFERENCES public.training_camps(id),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(inviter_user_id, referred_user_id, camp_type)
);

-- Enable RLS
ALTER TABLE public.camp_invite_referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own invites (as inviter or referred)
CREATE POLICY "Users can view own referrals" 
ON public.camp_invite_referrals 
FOR SELECT 
USING (auth.uid() = inviter_user_id OR auth.uid() = referred_user_id);

-- Users can create referrals where they are the referred user
CREATE POLICY "Users can create referrals as referred" 
ON public.camp_invite_referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_user_id);

-- Create index for efficient lookups
CREATE INDEX idx_camp_invite_referrals_inviter ON public.camp_invite_referrals(inviter_user_id);
CREATE INDEX idx_camp_invite_referrals_referred ON public.camp_invite_referrals(referred_user_id);
CREATE INDEX idx_camp_invite_referrals_status ON public.camp_invite_referrals(status);

-- Add comment
COMMENT ON TABLE public.camp_invite_referrals IS 'Tracks user-to-user camp invites for notification purposes';