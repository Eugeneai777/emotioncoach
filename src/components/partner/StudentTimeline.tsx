import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { UserPlus, Users, Flag, Crown, ShoppingCart, Calendar, CheckCircle2 } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: 'registered' | 'joined_group' | 'started_camp' | 'milestone' | 'purchased' | 'became_partner';
  date: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
}

interface StudentTimelineProps {
  studentId: string;
  registeredAt: string;
  hasJoinedGroup: boolean;
  joinedGroupAt: string | null;
  joinedCampAt: string | null;
  conversionStatus: string;
}

export function StudentTimeline({
  studentId,
  registeredAt,
  hasJoinedGroup,
  joinedGroupAt,
  joinedCampAt,
  conversionStatus
}: StudentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [studentId]);

  const loadTimeline = async () => {
    try {
      const timelineEvents: TimelineEvent[] = [];

      // 1. 注册事件
      timelineEvents.push({
        id: 'registered',
        type: 'registered',
        date: registeredAt,
        title: '加入有劲',
        description: '通过你的邀请链接注册成功',
        icon: <UserPlus className="w-3.5 h-3.5" />,
        color: 'bg-blue-500'
      });

      // 2. 入群事件
      if (hasJoinedGroup && joinedGroupAt) {
        timelineEvents.push({
          id: 'joined_group',
          type: 'joined_group',
          date: joinedGroupAt,
          title: '加入学员群',
          description: '已加入你的企业微信学员群',
          icon: <Users className="w-3.5 h-3.5" />,
          color: 'bg-teal-500'
        });
      }

      // 3. 开始训练营
      if (joinedCampAt) {
        timelineEvents.push({
          id: 'started_camp',
          type: 'started_camp',
          date: joinedCampAt,
          title: '开始训练营',
          description: '开始21天情绪管理训练营',
          icon: <Calendar className="w-3.5 h-3.5" />,
          color: 'bg-orange-500'
        });
      }

      // 4. 获取训练营里程碑
      const { data: camp } = await supabase
        .from('training_camps')
        .select('milestone_7_reached, milestone_14_reached, milestone_21_completed, current_day, updated_at')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (camp) {
        // 使用 updated_at 作为近似时间（数据库没有单独的达成时间字段）
        if (camp.milestone_7_reached) {
          timelineEvents.push({
            id: 'milestone_7',
            type: 'milestone',
            date: camp.updated_at || joinedCampAt || registeredAt,
            title: '完成第7天',
            description: '达成首周里程碑',
            icon: <Flag className="w-3.5 h-3.5" />,
            color: 'bg-amber-500'
          });
        }
        if (camp.milestone_14_reached) {
          timelineEvents.push({
            id: 'milestone_14',
            type: 'milestone',
            date: camp.updated_at || joinedCampAt || registeredAt,
            title: '完成第14天',
            description: '达成两周里程碑',
            icon: <Flag className="w-3.5 h-3.5" />,
            color: 'bg-amber-500'
          });
        }
        if (camp.milestone_21_completed) {
          timelineEvents.push({
            id: 'milestone_21',
            type: 'milestone',
            date: camp.updated_at || joinedCampAt || registeredAt,
            title: '完成21天训练营',
            description: '恭喜毕业！',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            color: 'bg-green-500'
          });
        }
      }

      // 5. 购买事件
      const { data: orders } = await supabase
        .from('orders')
        .select('package_key, paid_at, amount')
        .eq('user_id', studentId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: true });

      orders?.forEach((order, idx) => {
        if (order.paid_at) {
          const isPartner = order.package_key === 'partner';
          timelineEvents.push({
            id: `order_${idx}`,
            type: isPartner ? 'became_partner' : 'purchased',
            date: order.paid_at,
            title: isPartner ? '成为合伙人' : '购买365会员',
            description: isPartner 
              ? '恭喜！你将获得二级佣金收益'
              : `支付 ¥${order.amount}`,
            icon: isPartner ? <Crown className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />,
            color: isPartner ? 'bg-purple-500' : 'bg-green-500'
          });
        }
      });

      // 按时间排序
      timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Load timeline error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-2 px-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 px-4">
      <div className="relative pl-6 space-y-3">
        {/* 时间线 */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
        
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex items-start gap-3">
            {/* 时间点 */}
            <div className={`absolute -left-6 w-4 h-4 rounded-full ${event.color} flex items-center justify-center text-white z-10`}>
              {event.icon}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.date), "MM月dd日 HH:mm", { locale: zhCN })}
                </span>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}