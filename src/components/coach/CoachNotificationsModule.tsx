import { Button } from "@/components/ui/button";
import { NotificationCard } from "@/components/NotificationCard";
import { Bell } from "lucide-react";

interface Notification {
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
  coach_type?: string;
}

interface CoachNotificationsModuleProps {
  notifications: Notification[];
  loading: boolean;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  colorTheme: 'green' | 'purple' | 'blue' | 'pink' | 'amber';
  coachLabel: string;
}

const colorClasses = {
  green: {
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200/50',
    icon: 'text-green-600',
    label: 'text-green-700',
    badge: 'bg-green-100 text-green-600',
    button: 'border-green-300 text-green-600 hover:bg-green-50',
    counter: 'text-green-600/70'
  },
  purple: {
    gradient: 'from-purple-50 to-pink-50',
    border: 'border-purple-200/50',
    icon: 'text-purple-600',
    label: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-600',
    button: 'border-purple-300 text-purple-600 hover:bg-purple-50',
    counter: 'text-purple-600/70'
  },
  blue: {
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200/50',
    icon: 'text-blue-600',
    label: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-600',
    button: 'border-blue-300 text-blue-600 hover:bg-blue-50',
    counter: 'text-blue-600/70'
  },
  pink: {
    gradient: 'from-pink-50 to-rose-50',
    border: 'border-pink-200/50',
    icon: 'text-pink-600',
    label: 'text-pink-700',
    badge: 'bg-pink-100 text-pink-600',
    button: 'border-pink-300 text-pink-600 hover:bg-pink-50',
    counter: 'text-pink-600/70'
  },
  amber: {
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200/50',
    icon: 'text-amber-600',
    label: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-600',
    button: 'border-amber-300 text-amber-600 hover:bg-amber-50',
    counter: 'text-amber-600/70'
  }
};

export const CoachNotificationsModule = ({
  notifications,
  loading,
  currentIndex,
  onIndexChange,
  onMarkAsRead,
  onDelete,
  colorTheme,
  coachLabel
}: CoachNotificationsModuleProps) => {
  const unreadNotifications = notifications.filter(n => !n.is_read);
  
  if (loading || unreadNotifications.length === 0) {
    return null;
  }
  
  const safeIndex = Math.min(currentIndex, Math.max(0, unreadNotifications.length - 1));
  const colors = colorClasses[colorTheme];
  
  return (
    <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <div className={`bg-gradient-to-br ${colors.gradient} ${colors.border} border rounded-card-lg p-card shadow-md animate-in fade-in-50 duration-300`}>
        <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
          <Bell className={`h-4 w-4 ${colors.icon}`} />
          <span className={colors.label}>智能提醒</span>
          <span className={`text-xs px-2 py-0.5 ${colors.badge} rounded-full`}>{coachLabel}</span>
        </h4>
        
        <div className="space-y-3">
          <NotificationCard
            key={unreadNotifications[safeIndex].id}
            notification={unreadNotifications[safeIndex]}
            onClick={() => {
              onMarkAsRead(unreadNotifications[safeIndex].id);
              if (safeIndex >= unreadNotifications.length - 1) {
                onIndexChange(0);
              }
            }}
            onDelete={() => {
              onDelete(unreadNotifications[safeIndex].id);
              if (safeIndex >= unreadNotifications.length - 1) {
                onIndexChange(0);
              }
            }}
            colorTheme={colorTheme}
          />
          
          {unreadNotifications.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <span className={`text-xs ${colors.counter}`}>
                {safeIndex + 1} / {unreadNotifications.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIndexChange((currentIndex + 1) % unreadNotifications.length)}
                className={`h-7 text-xs ${colors.button}`}
              >
                下一条
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};