import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HumanCoach {
  id: string;
  user_id: string | null;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  specialties: string[];
  experience_years: number;
  education: string | null;
  training_background: string | null;
  trust_level: number;
  badge_type: string;
  rating: number;
  rating_professionalism: number;
  rating_communication: number;
  rating_helpfulness: number;
  total_reviews: number;
  positive_rate: number;
  total_sessions: number;
  status: string;
  is_verified: boolean;
  verified_at: string | null;
  is_accepting_new: boolean;
  intro_video_url: string | null;
  case_studies: any[];
  created_at: string;
}

export interface CoachService {
  id: string;
  coach_id: string;
  service_name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  advance_booking_days: number;
  cancel_hours_before: number;
  is_active: boolean;
  display_order: number;
}

export interface CoachCertification {
  id: string;
  coach_id: string;
  cert_type: string;
  cert_name: string;
  issuing_authority: string | null;
  cert_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  image_url: string | null;
  verification_status: string;
}

export interface CoachTimeSlot {
  id: string;
  coach_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_id: string | null;
}

export interface AppointmentReview {
  id: string;
  appointment_id: string;
  user_id: string;
  coach_id: string;
  rating_overall: number;
  rating_professionalism: number | null;
  rating_communication: number | null;
  rating_helpfulness: number | null;
  comment: string | null;
  quick_tags: string[];
  is_anonymous: boolean;
  coach_reply: string | null;
  coach_replied_at: string | null;
  created_at: string;
}

export interface ReviewQuickTag {
  id: string;
  tag_name: string;
  tag_type: string;
  display_order: number;
}

// 获取所有活跃教练
export function useActiveHumanCoaches() {
  return useQuery({
    queryKey: ["human-coaches", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select("*")
        .eq("status", "active")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as HumanCoach[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 获取单个教练详情
export function useHumanCoach(coachId: string | undefined) {
  return useQuery({
    queryKey: ["human-coach", coachId],
    queryFn: async () => {
      if (!coachId) return null;
      const { data, error } = await supabase
        .from("human_coaches")
        .select("*")
        .eq("id", coachId)
        .single();
      
      if (error) throw error;
      return data as HumanCoach;
    },
    enabled: !!coachId,
  });
}

// 获取教练的服务项目
export function useCoachServices(coachId: string | undefined) {
  return useQuery({
    queryKey: ["coach-services", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("coach_services")
        .select("*")
        .eq("coach_id", coachId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as CoachService[];
    },
    enabled: !!coachId,
  });
}

// 获取教练的资质认证
export function useCoachCertifications(coachId: string | undefined) {
  return useQuery({
    queryKey: ["coach-certifications", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("coach_certifications")
        .select("*")
        .eq("coach_id", coachId)
        .eq("verification_status", "verified");
      
      if (error) throw error;
      return data as CoachCertification[];
    },
    enabled: !!coachId,
  });
}

// 获取教练的可用时间段
export function useCoachTimeSlots(coachId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["coach-time-slots", coachId, date],
    queryFn: async () => {
      if (!coachId) return [];
      let query = supabase
        .from("coach_time_slots")
        .select("*")
        .eq("coach_id", coachId)
        .eq("status", "available")
        .gte("slot_date", new Date().toISOString().split("T")[0])
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true });
      
      if (date) {
        query = query.eq("slot_date", date);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CoachTimeSlot[];
    },
    enabled: !!coachId,
  });
}

// 获取教练的评价
export function useCoachReviews(coachId: string | undefined) {
  return useQuery({
    queryKey: ["coach-reviews", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("appointment_reviews")
        .select("*")
        .eq("coach_id", coachId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AppointmentReview[];
    },
    enabled: !!coachId,
  });
}

// 获取评价快捷标签
export function useReviewQuickTags() {
  return useQuery({
    queryKey: ["review-quick-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_quick_tags")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as ReviewQuickTag[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

// 创建评价
export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: {
      appointment_id: string;
      coach_id: string;
      rating_overall: number;
      rating_professionalism?: number;
      rating_communication?: number;
      rating_helpfulness?: number;
      comment?: string;
      quick_tags?: string[];
      is_anonymous?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");
      
      const { data, error } = await supabase
        .from("appointment_reviews")
        .insert({
          ...review,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coach-reviews", variables.coach_id] });
      queryClient.invalidateQueries({ queryKey: ["human-coach", variables.coach_id] });
    },
  });
}

// 获取徽章信息
export function getBadgeInfo(badgeType: string) {
  const badges: Record<string, { label: string; emoji: string; color: string; description: string }> = {
    new: {
      label: "新晋教练",
      emoji: "🌱",
      color: "bg-green-100 text-green-700 border-green-200",
      description: "刚加入平台的教练",
    },
    certified: {
      label: "认证教练",
      emoji: "⭐",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      description: "资质已通过平台审核",
    },
    preferred: {
      label: "优选教练",
      emoji: "🏆",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      description: "50+咨询，95%+好评率",
    },
    gold: {
      label: "金牌教练",
      emoji: "👑",
      color: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300",
      description: "100+咨询，98%+好评率",
    },
  };
  
  return badges[badgeType] || badges.new;
}
