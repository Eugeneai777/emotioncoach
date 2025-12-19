-- Create coach price tiers table
CREATE TABLE public.coach_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  tier_level INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default 4 tiers
INSERT INTO public.coach_price_tiers (tier_name, tier_level, price, description, display_order) VALUES
  ('金牌教练', 1, 2000, '顶级专家，10年以上经验', 1),
  ('高级教练', 2, 1200, '资深专家，5-10年经验', 2),
  ('认证教练', 3, 600, '认证专家，3-5年经验', 3),
  ('新锐教练', 4, 300, '新晋教练，通过认证', 4);

-- Add price tier fields to human_coaches
ALTER TABLE public.human_coaches 
  ADD COLUMN IF NOT EXISTS price_tier_id UUID REFERENCES public.coach_price_tiers(id),
  ADD COLUMN IF NOT EXISTS price_tier_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_tier_set_by UUID;

-- Enable RLS
ALTER TABLE public.coach_price_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active tiers" ON public.coach_price_tiers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tiers" ON public.coach_price_tiers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index
CREATE INDEX idx_coach_price_tiers_level ON public.coach_price_tiers(tier_level);
CREATE INDEX idx_human_coaches_price_tier ON public.human_coaches(price_tier_id);

-- Update trigger
CREATE TRIGGER update_coach_price_tiers_updated_at
  BEFORE UPDATE ON public.coach_price_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();