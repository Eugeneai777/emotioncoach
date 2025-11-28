import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Heart, Star, Sparkles, Trophy, Bell, MessageCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationCardProps {
  notification: {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    icon?: string;
    action_text?: string;
    action_type?: string;
    action_data?: any;
    priority: number;
    is_read: boolean;
    is_dismissed: boolean;
    created_at: string;
  };
  onClick: () => void;
  onDelete: () => void;
}

const iconMap: Record<string, any> = {
  Heart,
  Star,
  Sparkles,
  Trophy,
  Bell,
  MessageCircle,
  TrendingUp
};

const typeStyles: Record<string, { bg: string; border: string; badge: string }> = {
  encouragement: {
    bg: 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20',
    border: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
  },
  celebration: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
  },
  insight: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  },
  care: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
  },
  reminder: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  }
};

const typeLabels: Record<string, string> = {
  encouragement: '鼓励',
  celebration: '庆祝',
  insight: '洞察',
  care: '关怀',
  reminder: '提醒'
};

export const NotificationCard = ({ notification, onClick, onDelete }: NotificationCardProps) => {
  const navigate = useNavigate();
  const Icon = notification.icon ? iconMap[notification.icon] || Heart : Heart;
  const style = typeStyles[notification.notification_type] || typeStyles.encouragement;

  const handleAction = () => {
    onClick();
    
    if (notification.action_type === 'navigate' && notification.action_data?.path) {
      navigate(notification.action_data.path);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN
  });

  return (
    <Card 
      className={`relative p-3 transition-all hover:shadow-md ${style.bg} ${style.border} ${
        !notification.is_read ? 'border-2' : 'border'
      }`}
    >
      {/* Title Row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-primary flex-shrink-0" />
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          {!notification.is_read && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo}</span>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground text-left mb-2 leading-relaxed">
        {notification.message}
      </p>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-xs"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          删除
        </Button>
      </div>
    </Card>
  );
};
