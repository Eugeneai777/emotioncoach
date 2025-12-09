import { Bell, X } from "lucide-react";
import { NotificationCard } from "@/components/NotificationCard";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { Button } from "@/components/ui/button";

export const CommunicationNotificationsModule = () => {
  const { 
    notifications, 
    loading,
    markAsRead, 
    deleteNotification 
  } = useSmartNotification('communication_coach');

  // 过滤未读通知
  const unreadNotifications = notifications.filter(n => !n.is_read);

  // 加载中或无未读通知时隐藏整个模块
  if (loading || unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-card-lg p-card shadow-sm animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-700 dark:text-blue-300">智能提醒</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full">
            沟通教练
          </span>
        </h4>
      </div>
      
      <div className="space-y-3">
        {unreadNotifications.slice(0, 3).map((notification) => (
          <div key={notification.id} className="relative">
            <NotificationCard
              notification={notification}
              onClick={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          </div>
        ))}
      </div>
      
      {unreadNotifications.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
        >
          查看全部 {unreadNotifications.length} 条提醒
        </Button>
      )}
    </div>
  );
};
