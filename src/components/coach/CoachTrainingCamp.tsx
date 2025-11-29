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
        <div className="bg-card border border-border rounded-card-lg p-card-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-card-gap">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🏕️ 21天训练营
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-card">
            用21天养成习惯，获得专属徽章和成长洞察
          </p>
          <div className="flex gap-3">
            <Button onClick={onStartCamp} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              开启训练营
            </Button>
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              className="flex-1"
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
        <div className={`bg-gradient-to-br from-${colorTheme}-50 to-${colorTheme}-50 border border-${colorTheme}-200/50 rounded-card-lg p-card shadow-md`}>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
            <Bell className={`h-4 w-4 text-${colorTheme}-600`} />
            <span className={`text-${colorTheme}-700`}>智能提醒</span>
            <span className={`text-xs px-2 py-0.5 bg-${colorTheme}-100 text-${colorTheme}-600 rounded-full`}>
              {coachType}
            </span>
          </h4>
          
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                  <span className={`text-xs text-${colorTheme}-600/70`}>
                    {currentNotificationIndex + 1} / {notifications.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextNotification}
                    className={`h-7 text-xs border-${colorTheme}-300 text-${colorTheme}-600 hover:bg-${colorTheme}-50`}
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
