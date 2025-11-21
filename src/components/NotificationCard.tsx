import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Heart, Star, Sparkles, Trophy, Bell, MessageCircle, TrendingUp } from 'lucide-react';
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
    created_at: string;
  };
  onClick: () => void;
  onDismiss: () => void;
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

export const NotificationCard = ({ notification, onClick, onDismiss }: NotificationCardProps) => {
  const navigate = useNavigate();
  const Icon = notification.icon ? iconMap[notification.icon] || Heart : Heart;
  const style = typeStyles[notification.notification_type] || typeStyles.encouragement;

  const handleAction = () => {
    onClick();
    
    if (notification.action_type === 'navigate' && notification.action_data?.path) {
      navigate(notification.action_data.path);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN
  });

  return (
    <Card 
      className={`relative p-4 cursor-pointer transition-all hover:shadow-md ${style.bg} ${style.border} ${
        !notification.is_read ? 'border-2' : 'border'
      }`}
      onClick={onClick}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={style.badge}>
                {typeLabels[notification.notification_type] || '通知'}
              </Badge>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            {notification.action_text && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction();
                }}
              >
                {notification.action_text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
