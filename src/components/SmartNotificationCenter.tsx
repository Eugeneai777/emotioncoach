import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Filter } from 'lucide-react';
import { useSmartNotification } from '@/hooks/useSmartNotification';
import { NotificationCard } from './NotificationCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const SmartNotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [coachFilter, setCoachFilter] = useState<string | null>(null);
  const { notifications, unreadCount, loading, markAsRead, deleteNotification } = useSmartNotification(coachFilter);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
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
        
        {/* 教练筛选器 */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">筛选教练</span>
          </div>
          <Select value={coachFilter || 'all'} onValueChange={(value) => setCoachFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="所有教练" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有教练</SelectItem>
              <SelectItem value="emotion_coach">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">💚</span>
                  情绪觉醒教练
                </div>
              </SelectItem>
              <SelectItem value="parent_coach">
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">💜</span>
                  亲子教练
                </div>
              </SelectItem>
              <SelectItem value="life_coach">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-500">✨</span>
                  AI生活教练
                </div>
              </SelectItem>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <span>📢</span>
                  通用提醒
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(100vh-14rem)] mt-4">
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
                  onDelete={() => handleDelete(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
