import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentProgress {
  id: string;
  camp_id: string;
  user_id: string;
  progress_date: string;
  declaration_completed: boolean;
  declaration_completed_at: string | null;
  emotion_logs_count: number;
  last_emotion_log_at: string | null;
  reflection_completed: boolean;
  reflection_completed_at: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  checkin_type: string | null;
  video_learning_completed: boolean;
  videos_watched_count: number;
  has_shared_to_community: boolean;
}

export interface StudentCampInfo {
  assignment_id: string;
  camp_id: string;
  user_id: string;
  product_line: string;
  assigned_at: string;
  status: string;
  camp: {
    id: string;
    camp_name: string;
    camp_type: string;
    duration_days: number;
    start_date: string;
    end_date: string;
    current_day: number;
    completed_days: number;
    status: string;
  };
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  progress: StudentProgress[];
  tasks: {
    id: string;
    task_title: string;
    is_completed: boolean;
    completed_at: string | null;
    progress_date: string;
  }[];
}

// 获取教练的所有学员及其进度
export function useCoachStudentProgress(coachId: string | undefined) {
  return useQuery({
    queryKey: ['coach-student-progress', coachId],
    queryFn: async () => {
      if (!coachId) return [];

      // 1. 获取教练分配的所有学员
      const { data: assignments, error: assignError } = await supabase
        .from('camp_coach_assignments')
        .select('id, camp_id, user_id, product_line, assigned_at, status')
        .eq('coach_id', coachId)
        .in('status', ['active', 'completed'])
        .order('assigned_at', { ascending: false });

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];

      // 2. 获取训练营信息
      const campIds = [...new Set(assignments.map(a => a.camp_id))];
      const { data: camps } = await supabase
        .from('training_camps')
        .select('id, camp_name, camp_type, duration_days, start_date, end_date, current_day, completed_days, status')
        .in('id', campIds);

      const campMap = new Map(camps?.map(c => [c.id, c]) || []);

      // 3. 获取用户信息
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const userMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // 4. 获取每日进度
      const { data: progressData } = await supabase
        .from('camp_daily_progress')
        .select('*')
        .in('camp_id', campIds)
        .order('progress_date', { ascending: false });

      // 按camp_id分组
      const progressByCamp = new Map<string, StudentProgress[]>();
      progressData?.forEach(p => {
        const list = progressByCamp.get(p.camp_id) || [];
        list.push(p as StudentProgress);
        progressByCamp.set(p.camp_id, list);
      });

      // 5. 获取任务完成情况
      const { data: tasksData } = await supabase
        .from('camp_daily_tasks')
        .select('id, camp_id, task_title, is_completed, completed_at, progress_date')
        .in('camp_id', campIds)
        .order('progress_date', { ascending: false });

      const tasksByCamp = new Map<string, any[]>();
      tasksData?.forEach(t => {
        const list = tasksByCamp.get(t.camp_id) || [];
        list.push(t);
        tasksByCamp.set(t.camp_id, list);
      });

      // 6. 组装数据
      return assignments.map(assignment => ({
        assignment_id: assignment.id,
        camp_id: assignment.camp_id,
        user_id: assignment.user_id,
        product_line: assignment.product_line,
        assigned_at: assignment.assigned_at,
        status: assignment.status,
        camp: campMap.get(assignment.camp_id) || null,
        user: userMap.get(assignment.user_id) || null,
        progress: progressByCamp.get(assignment.camp_id) || [],
        tasks: tasksByCamp.get(assignment.camp_id) || [],
      })).filter(s => s.camp && s.user) as StudentCampInfo[];
    },
    enabled: !!coachId,
    refetchInterval: 30000, // 每30秒刷新一次
  });
}

// 获取单个学员的详细进度
export function useStudentDetailedProgress(campId: string | undefined) {
  return useQuery({
    queryKey: ['student-detailed-progress', campId],
    queryFn: async () => {
      if (!campId) return null;

      // 获取训练营信息
      const { data: camp, error: campError } = await supabase
        .from('training_camps')
        .select('*')
        .eq('id', campId)
        .single();

      if (campError) throw campError;

      // 获取用户信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', camp.user_id)
        .single();

      // 获取所有进度记录
      const { data: progress } = await supabase
        .from('camp_daily_progress')
        .select('*')
        .eq('camp_id', campId)
        .order('progress_date', { ascending: true });

      // 获取所有任务
      const { data: tasks } = await supabase
        .from('camp_daily_tasks')
        .select('*')
        .eq('camp_id', campId)
        .order('progress_date', { ascending: true });

      return {
        camp,
        user: profile,
        progress: progress || [],
        tasks: tasks || [],
      };
    },
    enabled: !!campId,
  });
}
