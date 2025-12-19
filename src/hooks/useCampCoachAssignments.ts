import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampCoachAssignment {
  id: string;
  camp_id: string;
  coach_id: string;
  purchase_id: string | null;
  user_id: string;
  product_line: string;
  assigned_at: string;
  assigned_by: string | null;
  status: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampDeliveryReview {
  id: string;
  assignment_id: string;
  camp_id: string;
  user_id: string;
  coach_id: string;
  rating_overall: number;
  rating_professionalism: number | null;
  rating_communication: number | null;
  rating_helpfulness: number | null;
  comment: string | null;
  quick_tags: string[] | null;
  is_anonymous: boolean;
  is_visible: boolean;
  coach_reply: string | null;
  coach_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

// 获取所有训练营教练分配（管理员）
export function useAllCampAssignments(status?: string) {
  return useQuery({
    queryKey: ['camp-coach-assignments', status],
    queryFn: async () => {
      let query = supabase
        .from('camp_coach_assignments')
        .select(`
          *,
          training_camps (
            id,
            camp_type,
            start_date,
            status,
            current_day
          ),
          human_coaches (
            id,
            name,
            avatar_url
          ),
          user_camp_purchases (
            id,
            amount,
            status
          ),
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// 获取待分配的绽放训练营购买记录
export function usePendingBloomPurchases() {
  return useQuery({
    queryKey: ['pending-bloom-purchases'],
    queryFn: async () => {
      // 获取已购买绽放训练营但还未分配教练的记录
      const { data: purchases, error } = await supabase
        .from('user_camp_purchases')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 获取绽放系列的camp_types
      const { data: bloomTemplates } = await supabase
        .from('camp_templates')
        .select('camp_type')
        .eq('category', 'bloom');

      const bloomTypes = new Set(bloomTemplates?.map(t => t.camp_type) || []);

      // 过滤出绽放系列的购买记录
      const bloomPurchases = purchases?.filter(p => bloomTypes.has(p.camp_type)) || [];

      // 获取用户信息
      const userIds = [...new Set(bloomPurchases.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // 获取已分配的purchase_id列表
      const { data: assignments } = await supabase
        .from('camp_coach_assignments')
        .select('purchase_id')
        .not('purchase_id', 'is', null);

      const assignedPurchaseIds = new Set(assignments?.map(a => a.purchase_id) || []);

      // 返回未分配的购买记录，附加用户信息
      return bloomPurchases
        .filter(p => !assignedPurchaseIds.has(p.id))
        .map(p => ({
          ...p,
          profiles: profileMap.get(p.user_id) || null,
          amount: p.purchase_price,
        }));
    },
  });
}

// 创建教练分配
export function useCreateCampAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campId,
      coachId,
      purchaseId,
      userId,
      productLine = 'bloom',
      notes
    }: {
      campId: string;
      coachId: string;
      purchaseId?: string;
      userId: string;
      productLine?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('camp_coach_assignments')
        .insert({
          camp_id: campId,
          coach_id: coachId,
          purchase_id: purchaseId,
          user_id: userId,
          product_line: productLine,
          assigned_by: user?.id,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camp-coach-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-bloom-purchases'] });
    },
  });
}

// 更新分配状态
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      status,
      notes
    }: {
      assignmentId: string;
      status: string;
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      if (notes) {
        updates.notes = notes;
      }

      const { error } = await supabase
        .from('camp_coach_assignments')
        .update(updates)
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camp-coach-assignments'] });
    },
  });
}

// 获取用户的训练营分配（含教练信息）
export function useUserCampAssignment(campId: string | undefined) {
  return useQuery({
    queryKey: ['user-camp-assignment', campId],
    queryFn: async () => {
      if (!campId) return null;

      const { data, error } = await supabase
        .from('camp_coach_assignments')
        .select(`
          *,
          human_coaches (
            id,
            name,
            avatar_url,
            title,
            specialties,
            rating,
            total_sessions
          )
        `)
        .eq('camp_id', campId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!campId,
  });
}

// 获取训练营交付评价
export function useCampDeliveryReviews(coachId?: string) {
  return useQuery({
    queryKey: ['camp-delivery-reviews', coachId],
    queryFn: async () => {
      let query = supabase
        .from('camp_delivery_reviews')
        .select(`
          *,
          training_camps (
            id,
            camp_type
          ),
          human_coaches (
            id,
            name,
            avatar_url
          ),
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (coachId) {
        query = query.eq('coach_id', coachId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// 创建训练营交付评价
export function useCreateCampReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      campId,
      coachId,
      ratingOverall,
      ratingProfessionalism,
      ratingCommunication,
      ratingHelpfulness,
      comment,
      quickTags,
      isAnonymous = false
    }: {
      assignmentId: string;
      campId: string;
      coachId: string;
      ratingOverall: number;
      ratingProfessionalism?: number;
      ratingCommunication?: number;
      ratingHelpfulness?: number;
      comment?: string;
      quickTags?: string[];
      isAnonymous?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('camp_delivery_reviews')
        .insert({
          assignment_id: assignmentId,
          camp_id: campId,
          user_id: user.id,
          coach_id: coachId,
          rating_overall: ratingOverall,
          rating_professionalism: ratingProfessionalism,
          rating_communication: ratingCommunication,
          rating_helpfulness: ratingHelpfulness,
          comment,
          quick_tags: quickTags,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) throw error;

      // 触发结算计算
      await supabase.functions.invoke('calculate-camp-settlement', {
        body: { camp_review_id: data.id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camp-delivery-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['camp-coach-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['coach-settlements'] });
    },
  });
}

// 检查用户是否已评价某个训练营
export function useHasCampReview(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['has-camp-review', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('camp_delivery_reviews')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!assignmentId,
  });
}
