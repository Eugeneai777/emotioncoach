import React, { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  caller_type: string;
  call_status: string;
  started_at: string;
  connected_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  end_reason: string | null;
  quality_rating: number | null;
  created_at: string;
  other_user?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface CoachCallHistoryProps {
  userId: string;
  isCoach?: boolean;
}

export function CoachCallHistory({ userId, isCoach = false }: CoachCallHistoryProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, [userId]);

  const loadCallHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_calls')
        .select('*')
        .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 获取其他用户信息
      const callsWithUsers = await Promise.all((data || []).map(async (call) => {
        const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', otherUserId)
          .single();

        return {
          ...call,
          other_user: { 
            display_name: profile?.display_name || '未知用户', 
            avatar_url: null 
          }
        };
      }));

      setCalls(callsWithUsers as CallRecord[]);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0秒';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}秒`;
    return `${mins}分${secs}秒`;
  };

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === userId;
    
    if (call.call_status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    if (call.call_status === 'rejected') {
      return <PhoneMissed className="w-4 h-4 text-orange-500" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="w-4 h-4 text-teal-500" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ended':
        return <Badge variant="secondary">已结束</Badge>;
      case 'missed':
        return <Badge variant="destructive">未接听</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">已拒绝</Badge>;
      case 'failed':
        return <Badge variant="destructive">连接失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            通话记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          通话记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无通话记录
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getCallIcon(call)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {call.other_user?.display_name}
                      </span>
                      {getStatusBadge(call.call_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(call.created_at), 'MM/dd HH:mm', { locale: zhCN })}
                      </span>
                      {call.duration_seconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(call.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>

                  {call.quality_rating && (
                    <div className="flex-shrink-0 text-yellow-500">
                      {'★'.repeat(call.quality_rating)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
