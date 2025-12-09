import { Button } from "@/components/ui/button";
import { Sparkles, Bell, Loader2 } from "lucide-react";
import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { NotificationCard } from "@/components/NotificationCard";
import { TrainingCamp } from "@/types/trainingCamp";

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
}

interface CoachTrainingCampProps {
  activeCamp: TrainingCamp | null;
  onStartCamp: () => void;
  onViewDetails: () => void;
  onCheckIn?: () => void;
  notifications?: Notification[];
  notificationsLoading?: boolean;
  currentNotificationIndex?: number;
  onNextNotification?: () => void;
  onMarkAsRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  colorTheme?: 'default' | 'purple' | 'green';
  coachType?: string;
}

export const CoachTrainingCamp = ({
  activeCamp,
  onStartCamp,
  onViewDetails,
  onCheckIn,
  notifications = [],
  notificationsLoading = false,
  currentNotificationIndex = 0,
  onNextNotification,
  onMarkAsRead,
  onDeleteNotification,
  colorTheme = "green",
  coachType = "情绪教练"
}: CoachTrainingCampProps) => {
  if (!activeCamp) {
    return (
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 
          border border-teal-200/40 rounded-xl p-5 shadow-sm
          dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10 dark:border-teal-800/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-teal-800 dark:text-teal-200">
              🏕️ 21天训练营
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            用21天养成习惯，获得专属徽章和成长洞察
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={onStartCamp} 
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              开启训练营
            </Button>
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              className="flex-1 border-teal-300/50 text-teal-700 hover:bg-teal-50/50 dark:border-teal-700/50 dark:text-teal-400"
            >
              了解详情
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <TrainingCampCard camp={activeCamp} onCheckIn={onCheckIn} />
      
      {/* Smart Notifications Display */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-blue-50/30 
          border border-teal-200/40 rounded-xl p-4 shadow-sm
          dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10 dark:border-teal-800/30">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-teal-600" />
            <span className="text-teal-700 dark:text-teal-400">智能提醒</span>
            <span className="text-xs px-2 py-0.5 bg-teal-100/50 text-teal-600 rounded-full dark:bg-teal-900/30 dark:text-teal-400">
              {coachType}
            </span>
          </h4>
          
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无新提醒
            </p>
          ) : (
            <div className="space-y-3">
              <NotificationCard
                key={notifications[currentNotificationIndex].id}
                notification={notifications[currentNotificationIndex]}
                onClick={() => onMarkAsRead?.(notifications[currentNotificationIndex].id)}
                onDelete={() => {
                  onDeleteNotification?.(notifications[currentNotificationIndex].id);
                }}
                colorTheme={colorTheme}
              />
              
              {notifications.length > 1 && onNextNotification && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-teal-600/70 dark:text-teal-400/70">
                    {currentNotificationIndex + 1} / {notifications.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextNotification}
                    className="h-7 text-xs border-teal-300/50 text-teal-600 hover:bg-teal-50/50 dark:border-teal-700/50 dark:text-teal-400"
                  >
                    下一条
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};