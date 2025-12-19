-- 1. 创建训练营教练分配表
CREATE TABLE public.camp_coach_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES public.training_camps(id) NOT NULL,
  coach_id UUID REFERENCES public.human_coaches(id) NOT NULL,
  purchase_id UUID REFERENCES public.user_camp_purchases(id),
  user_id UUID NOT NULL,
  product_line TEXT NOT NULL DEFAULT 'bloom',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建训练营交付评价表
CREATE TABLE public.camp_delivery_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.camp_coach_assignments(id) NOT NULL,
  camp_id UUID REFERENCES public.training_camps(id) NOT NULL,
  user_id UUID NOT NULL,
  coach_id UUID REFERENCES public.human_coaches(id) NOT NULL,
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_professionalism INTEGER CHECK (rating_professionalism >= 1 AND rating_professionalism <= 5),
  rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_helpfulness INTEGER CHECK (rating_helpfulness >= 1 AND rating_helpfulness <= 5),
  comment TEXT,
  quick_tags TEXT[],
  is_anonymous BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  coach_reply TEXT,
  coach_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 扩展结算记录表支持训练营
ALTER TABLE public.coach_settlements
  ADD COLUMN IF NOT EXISTS settlement_type TEXT NOT NULL DEFAULT 'appointment',
  ADD COLUMN IF NOT EXISTS camp_id UUID REFERENCES public.training_camps(id),
  ADD COLUMN IF NOT EXISTS camp_review_id UUID REFERENCES public.camp_delivery_reviews(id),
  ADD COLUMN IF NOT EXISTS product_line TEXT NOT NULL DEFAULT 'youjin';

-- 4. 启用RLS
ALTER TABLE public.camp_coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camp_delivery_reviews ENABLE ROW LEVEL SECURITY;

-- 5. camp_coach_assignments RLS策略
CREATE POLICY "管理员可管理所有分配"
  ON public.camp_coach_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "教练可查看自己的分配"
  ON public.camp_coach_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.human_coaches
    WHERE human_coaches.id = camp_coach_assignments.coach_id
    AND human_coaches.user_id = auth.uid()
  ));

CREATE POLICY "用户可查看自己的分配"
  ON public.camp_coach_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- 6. camp_delivery_reviews RLS策略
CREATE POLICY "管理员可管理所有评价"
  ON public.camp_delivery_reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "用户可创建自己的评价"
  ON public.camp_delivery_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可查看自己的评价"
  ON public.camp_delivery_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "教练可查看自己的评价"
  ON public.camp_delivery_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.human_coaches
    WHERE human_coaches.id = camp_delivery_reviews.coach_id
    AND human_coaches.user_id = auth.uid()
  ));

CREATE POLICY "可见评价对所有用户可查看"
  ON public.camp_delivery_reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "教练可回复自己的评价"
  ON public.camp_delivery_reviews FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.human_coaches
    WHERE human_coaches.id = camp_delivery_reviews.coach_id
    AND human_coaches.user_id = auth.uid()
  ));

-- 7. 索引
CREATE INDEX idx_camp_coach_assignments_camp_id ON public.camp_coach_assignments(camp_id);
CREATE INDEX idx_camp_coach_assignments_coach_id ON public.camp_coach_assignments(coach_id);
CREATE INDEX idx_camp_coach_assignments_user_id ON public.camp_coach_assignments(user_id);
CREATE INDEX idx_camp_coach_assignments_status ON public.camp_coach_assignments(status);
CREATE INDEX idx_camp_delivery_reviews_assignment_id ON public.camp_delivery_reviews(assignment_id);
CREATE INDEX idx_camp_delivery_reviews_coach_id ON public.camp_delivery_reviews(coach_id);
CREATE INDEX idx_coach_settlements_settlement_type ON public.coach_settlements(settlement_type);
CREATE INDEX idx_coach_settlements_product_line ON public.coach_settlements(product_line);

-- 8. 更新时间触发器
CREATE TRIGGER update_camp_coach_assignments_updated_at
  BEFORE UPDATE ON public.camp_coach_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_camp_delivery_reviews_updated_at
  BEFORE UPDATE ON public.camp_delivery_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();