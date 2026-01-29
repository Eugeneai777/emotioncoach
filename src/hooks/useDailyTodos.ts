import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DailyTodo {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_time: number | null;
  completed: boolean;
  completed_at: string | null;
  source: 'ai_call' | 'manual' | 'voice';
  call_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTodoSummary {
  id: string;
  user_id: string;
  date: string;
  total_count: number;
  completed_count: number;
  completion_rate: number | null;
  overdue_items: { title: string; priority: string }[] | null;
  ai_summary: string | null;
  insights: string | null;
  created_at: string;
}

export function useDailyTodos(date?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ['daily-todos', user?.id, targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_todos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', targetDate)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as DailyTodo[];
    },
    enabled: !!user?.id,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['daily-todo-summary', user?.id, targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_todo_summaries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', targetDate)
        .maybeSingle();

      if (error) throw error;
      return data as DailyTodoSummary | null;
    },
    enabled: !!user?.id,
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('daily_todos')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-todos'] });
      queryClient.invalidateQueries({ queryKey: ['daily-todo-summary'] });
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const addTodo = useMutation({
    mutationFn: async ({ title, priority = 'medium', estimated_time }: { 
      title: string; 
      priority?: 'high' | 'medium' | 'low';
      estimated_time?: number;
    }) => {
      const { data, error } = await supabase
        .from('daily_todos')
        .insert({
          user_id: user!.id,
          date: targetDate,
          title,
          priority,
          estimated_time,
          source: 'manual',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-todos'] });
      toast.success('待办已添加');
    },
    onError: () => {
      toast.error('添加失败，请重试');
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_todos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-todos'] });
      toast.success('待办已删除');
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  return {
    todos,
    summary,
    isLoading: todosLoading || summaryLoading,
    toggleTodo,
    addTodo,
    deleteTodo,
  };
}
