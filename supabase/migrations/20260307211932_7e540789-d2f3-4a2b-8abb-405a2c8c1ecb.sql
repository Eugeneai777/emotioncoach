
-- CRM: Follow-up notes for partner students
CREATE TABLE public.partner_student_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  note TEXT NOT NULL,
  follow_up_type TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.partner_student_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.partner_student_followups FOR ALL TO service_role USING (true);

-- CRM: Student tags
CREATE TABLE public.partner_student_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, referred_user_id, tag)
);
ALTER TABLE public.partner_student_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.partner_student_tags FOR ALL TO service_role USING (true);

-- Marketing: AI-generated copies
CREATE TABLE public.partner_marketing_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  copy_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  is_favorite BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.partner_marketing_copies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.partner_marketing_copies FOR ALL TO service_role USING (true);

-- Promotions: Flash sales, group buys
CREATE TABLE public.partner_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  promotion_type TEXT NOT NULL DEFAULT 'flash_sale',
  description TEXT,
  original_price NUMERIC(10,2),
  promo_price NUMERIC(10,2) NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft',
  target_product_type TEXT,
  target_product_id TEXT,
  promo_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.partner_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.partner_promotions FOR ALL TO service_role USING (true);
