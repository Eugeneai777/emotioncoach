
-- 1. 真人教练表（含信任系统字段）
CREATE TABLE public.human_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  title TEXT,
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  training_background TEXT,
  
  -- 信任系统字段
  trust_level INTEGER DEFAULT 1,
  badge_type TEXT DEFAULT 'new',
  rating NUMERIC(3,2) DEFAULT 5.00,
  rating_professionalism NUMERIC(3,2) DEFAULT 5.00,
  rating_communication NUMERIC(3,2) DEFAULT 5.00,
  rating_helpfulness NUMERIC(3,2) DEFAULT 5.00,
  total_reviews INTEGER DEFAULT 0,
  positive_rate NUMERIC(5,2) DEFAULT 100.00,
  total_sessions INTEGER DEFAULT 0,
  
  -- 状态字段
  status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  is_accepting_new BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- 展示内容
  intro_video_url TEXT,
  case_studies JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 教练资质认证表
CREATE TABLE public.coach_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL,
  cert_name TEXT NOT NULL,
  issuing_authority TEXT,
  cert_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  image_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 教练服务项目表
CREATE TABLE public.coach_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  price NUMERIC(10,2) NOT NULL,
  advance_booking_days INTEGER DEFAULT 7,
  cancel_hours_before INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 教练可预约时间段表
CREATE TABLE public.coach_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available',
  appointment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 5. 预约记录表
CREATE TABLE public.coaching_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id),
  slot_id UUID REFERENCES public.coach_time_slots(id),
  service_id UUID REFERENCES public.coach_services(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  service_name TEXT,
  amount_paid NUMERIC(10,2) NOT NULL,
  order_id UUID,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending_payment',
  user_notes TEXT,
  coach_notes TEXT,
  meeting_type TEXT DEFAULT 'voice',
  meeting_link TEXT,
  room_id UUID,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 预约评价表（多维度评分）
CREATE TABLE public.appointment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.coaching_appointments(id) UNIQUE,
  user_id UUID NOT NULL,
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id),
  
  -- 多维度评分 (1-5)
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_professionalism INTEGER CHECK (rating_professionalism >= 1 AND rating_professionalism <= 5),
  rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_helpfulness INTEGER CHECK (rating_helpfulness >= 1 AND rating_helpfulness <= 5),
  
  -- 评价内容
  comment TEXT,
  quick_tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT false,
  
  -- 教练回复
  coach_reply TEXT,
  coach_replied_at TIMESTAMPTZ,
  
  -- 管理字段
  is_visible BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 评价快捷标签定义表
CREATE TABLE public.review_quick_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'positive',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 插入默认快捷标签
INSERT INTO public.review_quick_tags (tag_name, tag_type, display_order) VALUES
('专业耐心', 'positive', 1),
('倾听能力强', 'positive', 2),
('建议实用', 'positive', 3),
('态度温和', 'positive', 4),
('分析透彻', 'positive', 5),
('有洞察力', 'positive', 6),
('帮助很大', 'positive', 7),
('时间准时', 'positive', 8),
('沟通流畅', 'neutral', 10),
('有待改进', 'constructive', 20),
('希望更具体', 'constructive', 21);

-- 启用 RLS
ALTER TABLE public.human_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_quick_tags ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- 教练表：已激活的对所有认证用户可见
CREATE POLICY "已激活教练对所有用户可见" ON public.human_coaches
  FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "用户可以创建自己的教练档案" ON public.human_coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "教练可以更新自己的档案" ON public.human_coaches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "管理员可以管理所有教练" ON public.human_coaches
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 资质认证表
CREATE POLICY "教练可以管理自己的资质" ON public.coach_certifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

CREATE POLICY "已认证资质对所有用户可见" ON public.coach_certifications
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "管理员可以管理所有资质" ON public.coach_certifications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 服务项目表
CREATE POLICY "服务项目对所有用户可见" ON public.coach_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "教练可以管理自己的服务" ON public.coach_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- 时间段表
CREATE POLICY "时间段对所有用户可见" ON public.coach_time_slots
  FOR SELECT USING (true);

CREATE POLICY "教练可以管理自己的时间段" ON public.coach_time_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- 预约记录表
CREATE POLICY "用户可以查看自己的预约" ON public.coaching_appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "教练可以查看自己的预约" ON public.coaching_appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

CREATE POLICY "用户可以创建预约" ON public.coaching_appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户和教练可以更新预约" ON public.coaching_appointments
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- 评价表
CREATE POLICY "可见评价对所有用户可见" ON public.appointment_reviews
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的评价" ON public.appointment_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.coaching_appointments WHERE id = appointment_id AND user_id = auth.uid() AND status = 'completed')
  );

CREATE POLICY "用户可以更新自己的评价" ON public.appointment_reviews
  FOR UPDATE USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '7 days');

CREATE POLICY "教练可以回复评价" ON public.appointment_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.human_coaches WHERE id = coach_id AND user_id = auth.uid())
  );

-- 快捷标签对所有用户可见
CREATE POLICY "快捷标签对所有用户可见" ON public.review_quick_tags
  FOR SELECT USING (is_active = true);

-- 创建更新教练评分的函数
CREATE OR REPLACE FUNCTION public.update_coach_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_overall NUMERIC(3,2);
  avg_prof NUMERIC(3,2);
  avg_comm NUMERIC(3,2);
  avg_help NUMERIC(3,2);
  review_count INTEGER;
  positive_count INTEGER;
  pos_rate NUMERIC(5,2);
  new_badge TEXT;
BEGIN
  -- 计算平均评分
  SELECT 
    COALESCE(AVG(rating_overall), 5.00),
    COALESCE(AVG(rating_professionalism), 5.00),
    COALESCE(AVG(rating_communication), 5.00),
    COALESCE(AVG(rating_helpfulness), 5.00),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating_overall >= 4)
  INTO avg_overall, avg_prof, avg_comm, avg_help, review_count, positive_count
  FROM public.appointment_reviews
  WHERE coach_id = NEW.coach_id AND is_visible = true;
  
  -- 计算好评率
  IF review_count > 0 THEN
    pos_rate := (positive_count::NUMERIC / review_count::NUMERIC) * 100;
  ELSE
    pos_rate := 100.00;
  END IF;
  
  -- 确定徽章等级
  SELECT 
    CASE
      WHEN review_count >= 100 AND pos_rate >= 98 THEN 'gold'
      WHEN review_count >= 50 AND pos_rate >= 95 THEN 'preferred'
      WHEN is_verified = true THEN 'certified'
      ELSE 'new'
    END INTO new_badge
  FROM public.human_coaches
  WHERE id = NEW.coach_id;
  
  -- 更新教练评分
  UPDATE public.human_coaches
  SET 
    rating = avg_overall,
    rating_professionalism = avg_prof,
    rating_communication = avg_comm,
    rating_helpfulness = avg_help,
    total_reviews = review_count,
    positive_rate = pos_rate,
    badge_type = new_badge,
    updated_at = NOW()
  WHERE id = NEW.coach_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 创建触发器
CREATE TRIGGER trigger_update_coach_ratings
AFTER INSERT OR UPDATE ON public.appointment_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_coach_ratings();

-- 更新时间戳触发器
CREATE TRIGGER update_human_coaches_updated_at
BEFORE UPDATE ON public.human_coaches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coaching_appointments_updated_at
BEFORE UPDATE ON public.coaching_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
