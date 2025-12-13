import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Calendar, 
  Star, 
  Info,
  Check,
  CheckCheck,
  Clock,
  XCircle,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCoachNotifications, CoachNotification } from "@/hooks/useCoachNotifications";
import { cn } from "@/lib/utils";

interface CoachNotificationCenterProps {
  coachId: string;
  onNavigate?: (tab: string) => void;
}

const NotificationIcon = ({ type }: { type: CoachNotification['type'] }) => {
  switch (type) {
    case 'new_appointment':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'appointment_confirmed':
      return <Check className="h-4 w-4 text-emerald-500" />;
    case 'appointment_cancelled':
      return <XCircle className="h-4 w-4 text-rose-500" />;
    case 'new_review':
      return <Star className="h-4 w-4 text-yellow-500" />;
    case 'system':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const NotificationItem = ({ 
  notification, 
  onRead,
  onNavigate
}: { 
  notification: CoachNotification;
  onRead: () => void;
  onNavigate?: (tab: string) => void;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.is_read) {
      onRead();
    }
    
    // 根据通知类型导航到相应页面
    if (notification.type === 'new_appointment' || 
        notification.type === 'appointment_confirmed' ||
        notification.type === 'appointment_cancelled') {
      onNavigate?.('appointments');
    } else if (notification.type === 'new_review') {
      onNavigate?.('reviews');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        notification.is_read 
          ? "bg-muted/30 hover:bg-muted/50" 
          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
      )}
    >
      <div className="mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm truncate",
            !notification.is_read && "font-medium"
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true, 
            locale: zhCN 
          })}
        </p>
      </div>
    </div>
  );
};

export const CoachNotificationCenter = ({ coachId, onNavigate }: CoachNotificationCenterProps) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refresh 
  } = useCoachNotifications(coachId);
  
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'appointments') {
      return n.type === 'new_appointment' || 
             n.type === 'appointment_confirmed' || 
             n.type === 'appointment_cancelled';
    }
    if (activeTab === 'reviews') return n.type === 'new_review';
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const appointmentCount = notifications.filter(n => 
    !n.is_read && (n.type === 'new_appointment' || n.type === 'appointment_confirmed' || n.type === 'appointment_cancelled')
  ).length;
  
  const reviewCount = notifications.filter(n => !n.is_read && n.type === 'new_review').length;
  const systemCount = notifications.filter(n => !n.is_read && n.type === 'system').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">消息中心</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                全部已读
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">
              全部
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs">
              预约
              {appointmentCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {appointmentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">
              评价
              {reviewCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {reviewCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              系统
              {systemCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {systemCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[400px] pr-3">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
