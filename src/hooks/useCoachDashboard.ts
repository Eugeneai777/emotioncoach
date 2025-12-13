import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export interface CoachStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalIncome: number;
  pendingIncome: number;
  averageRating: number;
  totalReviews: number;
  thisMonthAppointments: number;
  thisMonthIncome: number;
}

export interface TimeSlot {
  id: string;
  coach_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_id: string | null;
  created_at: string;
}

export interface CoachAppointment {
  id: string;
  user_id: string;
  coach_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  service_name: string | null;
  status: string;
  payment_status: string;
  amount_paid: number;
  user_notes: string | null;
  coach_notes: string | null;
  meeting_link: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CoachReview {
  id: string;
  appointment_id: string;
  user_id: string;
  coach_id: string;
  rating_overall: number;
  rating_professionalism: number | null;
  rating_communication: number | null;
  rating_helpfulness: number | null;
  comment: string | null;
  quick_tags: string[] | null;
  coach_reply: string | null;
  coach_replied_at: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useCoachProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['coach-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('human_coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useCoachStats(coachId: string | undefined) {
  return useQuery({
    queryKey: ['coach-stats', coachId],
    queryFn: async (): Promise<CoachStats> => {
      if (!coachId) throw new Error('Coach ID required');
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all appointments
      const { data: appointments, error: appError } = await supabase
        .from('coaching_appointments')
        .select('*')
        .eq('coach_id', coachId);
      
      if (appError) throw appError;
      
      // Get reviews
      const { data: reviews, error: revError } = await supabase
        .from('appointment_reviews')
        .select('rating_overall')
        .eq('coach_id', coachId)
        .eq('is_visible', true);
      
      if (revError) throw revError;
      
      const completed = appointments?.filter(a => a.status === 'completed') || [];
      const pending = appointments?.filter(a => ['confirmed', 'pending_payment'].includes(a.status || '')) || [];
      const thisMonth = appointments?.filter(a => 
        new Date(a.created_at || '') >= firstDayOfMonth && a.status === 'completed'
      ) || [];
      
      const totalIncome = completed.reduce((sum, a) => sum + Number(a.amount_paid || 0), 0);
      const pendingIncome = pending.reduce((sum, a) => sum + Number(a.amount_paid || 0), 0);
      const thisMonthIncome = thisMonth.reduce((sum, a) => sum + Number(a.amount_paid || 0), 0);
      
      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length 
        : 5;
      
      return {
        totalAppointments: appointments?.length || 0,
        completedAppointments: completed.length,
        pendingAppointments: pending.length,
        totalIncome,
        pendingIncome,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews?.length || 0,
        thisMonthAppointments: thisMonth.length,
        thisMonthIncome,
      };
    },
    enabled: !!coachId,
  });
}

export function useCoachTimeSlots(coachId: string | undefined, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['coach-time-slots', coachId, startDate, endDate],
    queryFn: async () => {
      if (!coachId) return [];
      
      let query = supabase
        .from('coach_time_slots')
        .select('*')
        .eq('coach_id', coachId)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (startDate) {
        query = query.gte('slot_date', startDate);
      }
      if (endDate) {
        query = query.lte('slot_date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimeSlot[];
    },
    enabled: !!coachId,
  });
}

export function useCoachAppointments(coachId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['coach-appointments', coachId, status],
    queryFn: async () => {
      if (!coachId) return [];
      
      let query = supabase
        .from('coaching_appointments')
        .select('*')
        .eq('coach_id', coachId)
        .order('appointment_date', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CoachAppointment[];
    },
    enabled: !!coachId,
  });
}

export function useCoachReviews(coachId: string | undefined) {
  return useQuery({
    queryKey: ['coach-reviews-management', coachId],
    queryFn: async () => {
      if (!coachId) return [];
      
      const { data, error } = await supabase
        .from('appointment_reviews')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CoachReview[];
    },
    enabled: !!coachId,
  });
}

export function useCreateTimeSlots() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slots: Omit<TimeSlot, 'id' | 'created_at'>[]) => {
      const { data, error } = await supabase
        .from('coach_time_slots')
        .insert(slots)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-time-slots'] });
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('coach_time_slots')
        .delete()
        .eq('id', slotId)
        .eq('status', 'available');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-time-slots'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CoachAppointment> }) => {
      const { data, error } = await supabase
        .from('coaching_appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['coach-stats'] });
    },
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const { data, error } = await supabase
        .from('appointment_reviews')
        .update({
          coach_reply: reply,
          coach_replied_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-reviews-management'] });
    },
  });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ coachId, updates }: { coachId: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('human_coaches')
        .update(updates)
        .eq('id', coachId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-profile'] });
    },
  });
}
