import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// 使用数据库类型
type TeamCoachingSessionRow = Database['public']['Tables']['team_coaching_sessions']['Row'];
type TeamCoachingEnrollmentRow = Database['public']['Tables']['team_coaching_enrollments']['Row'];

export interface TeamCoachingSession extends TeamCoachingSessionRow {
  partner?: {
    id: string;
    partner_code: string;
    user_id: string;
  } & {
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export interface TeamCoachingEnrollment extends TeamCoachingEnrollmentRow {
  session?: TeamCoachingSessionRow;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// 获取已发布的课程列表
export function usePublishedSessions(filter?: 'all' | 'free' | 'paid') {
  return useQuery({
    queryKey: ['team-coaching-sessions', 'published', filter],
    queryFn: async () => {
      let query = supabase
        .from('team_coaching_sessions')
        .select(`
          *,
          partner:partners (
            id, partner_code, user_id
          )
        `)
        .eq('status', 'published')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (filter === 'free') {
        query = query.eq('is_free', true);
      } else if (filter === 'paid') {
        query = query.eq('is_free', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // 获取合伙人的 profiles 信息
      if (data && data.length > 0) {
        const userIds = data
          .map(s => s.partner?.user_id)
          .filter((id): id is string => !!id);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          
          return data.map(session => ({
            ...session,
            partner: session.partner ? {
              ...session.partner,
              profiles: profileMap.get(session.partner.user_id) || null
            } : undefined
          })) as TeamCoachingSession[];
        }
      }
      
      return (data || []) as TeamCoachingSession[];
    },
  });
}

// 获取单个课程详情
export function useSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['team-coaching-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('team_coaching_sessions')
        .select(`
          *,
          partner:partners (
            id, partner_code, user_id
          )
        `)
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      
      // 获取合伙人的 profile
      if (data?.partner?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', data.partner.user_id)
          .single();
        
        return {
          ...data,
          partner: {
            ...data.partner,
            profiles: profile
          }
        } as TeamCoachingSession;
      }
      
      return data as TeamCoachingSession;
    },
    enabled: !!sessionId,
  });
}

// 获取合伙人自己的课程列表
export function usePartnerSessions(partnerId: string | undefined) {
  return useQuery({
    queryKey: ['team-coaching-sessions', 'partner', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from('team_coaching_sessions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeamCoachingSession[];
    },
    enabled: !!partnerId,
  });
}

// 获取课程的报名列表
export function useSessionEnrollments(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['team-coaching-enrollments', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('team_coaching_enrollments')
        .select('*')
        .eq('session_id', sessionId)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      
      // 获取用户 profiles
      if (data && data.length > 0) {
        const userIds = data.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return data.map(enrollment => ({
          ...enrollment,
          profiles: profileMap.get(enrollment.user_id) || null
        })) as TeamCoachingEnrollment[];
      }
      
      return data as TeamCoachingEnrollment[];
    },
    enabled: !!sessionId,
  });
}

// 检查用户是否已报名
export function useUserEnrollment(sessionId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['team-coaching-enrollment', sessionId, userId],
    queryFn: async () => {
      if (!sessionId || !userId) return null;
      const { data, error } = await supabase
        .from('team_coaching_enrollments')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as TeamCoachingEnrollment | null;
    },
    enabled: !!sessionId && !!userId,
  });
}

// 获取用户所有已报名的课程
export function useUserEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['team-coaching-enrollments', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('team_coaching_enrollments')
        .select(`
          *,
          session:team_coaching_sessions (*)
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data as (TeamCoachingEnrollment & { session: TeamCoachingSessionRow })[];
    },
    enabled: !!user?.id,
  });
}

// 创建课程
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['team_coaching_sessions']['Insert']) => {
      const { data: result, error } = await supabase
        .from('team_coaching_sessions')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-sessions'] });
      toast.success('课程创建成功');
    },
    onError: (error: Error) => {
      toast.error('创建失败: ' + error.message);
    },
  });
}

// 更新课程
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Database['public']['Tables']['team_coaching_sessions']['Update'] & { id: string }) => {
      const { data: result, error } = await supabase
        .from('team_coaching_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-session', variables.id] });
      toast.success('课程更新成功');
    },
    onError: (error: Error) => {
      toast.error('更新失败: ' + error.message);
    },
  });
}

// 免费课程报名
export function useEnrollFreeSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error('请先登录');

      // 检查课程信息
      const { data: session, error: sessionError } = await supabase
        .from('team_coaching_sessions')
        .select('current_count, max_participants, is_free')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session.is_free) throw new Error('此课程需要付费');
      if ((session.current_count || 0) >= session.max_participants) {
        throw new Error('课程已满，无法报名');
      }

      // 检查是否已报名
      const { data: existing } = await supabase
        .from('team_coaching_enrollments')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) throw new Error('您已报名此课程');

      // 创建报名记录
      const { error: enrollError } = await supabase
        .from('team_coaching_enrollments')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          payment_status: 'free',
          amount_paid: 0,
        });

      if (enrollError) throw enrollError;

      // 增加报名人数
      await supabase.rpc('increment_session_count', { p_session_id: sessionId });

      return { success: true };
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollment', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollments'] });
      toast.success('报名成功！');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// 取消报名（仅限免费课程）
export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId, sessionId }: { enrollmentId: string; sessionId: string }) => {
      // 删除报名记录
      const { error } = await supabase
        .from('team_coaching_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      // 减少报名人数
      await supabase.rpc('decrement_session_count', { p_session_id: sessionId });

      return { success: true };
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollment', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollments'] });
      toast.success('已取消报名');
    },
    onError: (error: Error) => {
      toast.error('取消失败: ' + error.message);
    },
  });
}

// 付费课程报名（创建订单后等待支付）
export function useEnrollPaidSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, orderNo, amountPaid }: { sessionId: string; orderNo: string; amountPaid: number }) => {
      if (!user?.id) throw new Error('请先登录');

      // 创建报名记录（待支付状态）
      const { error: enrollError } = await supabase
        .from('team_coaching_enrollments')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          order_no: orderNo,
          amount_paid: amountPaid,
          payment_status: 'pending',
        });

      if (enrollError) throw enrollError;

      return { success: true };
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollment', sessionId] });
    },
    onError: (error: Error) => {
      console.error('Enroll paid session error:', error);
    },
  });
}

// 确认支付成功（更新报名状态）
export function useConfirmEnrollmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderNo, sessionId }: { orderNo: string; sessionId: string }) => {
      // 更新报名状态为已支付
      const { error: updateError } = await supabase
        .from('team_coaching_enrollments')
        .update({ payment_status: 'paid' })
        .eq('order_no', orderNo);

      if (updateError) throw updateError;

      // 增加报名人数
      await supabase.rpc('increment_session_count', { p_session_id: sessionId });

      return { success: true };
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-coaching-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollment', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollments'] });
      toast.success('报名成功！');
    },
    onError: (error: Error) => {
      toast.error('确认支付失败: ' + error.message);
    },
  });
}
