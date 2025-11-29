import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ParentCoachSession {
  id: string;
  current_stage: number;
  event_description?: string;
  stage_selections?: any;
  status: string;
}

export const useParentCoach = () => {
  const [session, setSession] = useState<ParentCoachSession | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [videoRecommendations, setVideoRecommendations] = useState<any[]>([]);
  const { toast } = useToast();

  const createSession = async (campId?: string, eventDescription?: string) => {
    // Prevent duplicate creation
    if (isCreating || session) {
      console.log('Session creation skipped - already creating or session exists');
      return session;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Creating new session for user:', user.id, 'campId:', campId);

      const { data, error } = await supabase
        .from('parent_coaching_sessions')
        .insert({
          user_id: user.id,
          camp_id: campId,
          event_description: eventDescription,
          current_stage: 0,  // 🔧 Start from stage 0 for event capture
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Session created successfully:', data);
      setSession(data);
      return data;
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: '创建会话失败',
        description: '请稍后重试',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('parent_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
      return data;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  };

  const sendMessage = async (message: string) => {
    console.log('sendMessage called, session:', session, 'message:', message);
    
    if (!session) {
      console.log('No session found, showing toast');
      toast({
        title: '请先创建会话',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      console.log('Calling parent-emotion-coach function, sessionId:', session.id);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parent-emotion-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession?.access_token}`
          },
          body: JSON.stringify({
            sessionId: session.id,
            message,
            action: 'chat'
          })
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error('API request failed');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // 🔧 Only add message if content is not empty
      if (data.content && data.content.trim()) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.content 
        }]);
      }

      if (data.toolCall?.name === 'complete_stage') {
        // Reload session to get updated stage
        await loadSession(session.id);
      }

      if (data.completed) {
        // Session completed
        setSession(prev => prev ? { ...prev, status: 'completed' } : null);
      }

      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: '发送失败',
        description: '请稍后重试',
        variant: 'destructive'
      });
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setSession(null);
    setMessages([]);
  };

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  };

  const fetchRecommendations = async (briefingData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('recommend-courses', {
        body: {
          briefing: {
            emotion_theme: briefingData.emotion_theme,
            emotion_tags: ['亲子关系', '家长情绪'],
            insight: briefingData.insight,
            action: briefingData.action
          }
        }
      });

      if (!error && data?.recommendations) {
        setVideoRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error getting video recommendations:", error);
    }
  };

  const resetRecommendations = () => {
    setVideoRecommendations([]);
  };

  return {
    session,
    messages,
    isLoading,
    isCreating,
    videoRecommendations,
    createSession,
    loadSession,
    sendMessage,
    resetSession,
    addAssistantMessage,
    fetchRecommendations,
    resetRecommendations
  };
};