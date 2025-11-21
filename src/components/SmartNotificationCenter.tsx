import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { useSmartNotification } from '@/hooks/useSmartNotification';
import { NotificationCard } from './NotificationCard';

export const SmartNotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAsDismissed } = useSmartNotification();

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleDismiss = (notificationId: string) => {
    markAsDismissed(notificationId);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            智能通知
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} 条未读</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">暂无新通知</p>
              <p className="text-sm text-muted-foreground mt-1">
                我们会在适当的时候为你送上关怀与鼓励
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification.id)}
                  onDismiss={() => handleDismiss(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
