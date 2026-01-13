import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWeChatBindStatus } from '@/hooks/useWeChatBindStatus';
import { MessageSquare, ChevronRight, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeChatBindQuickEntryProps {
  variant?: 'banner' | 'card' | 'compact';
  className?: string;
  onDismiss?: () => void;
}

export function WeChatBindQuickEntry({
  variant = 'banner',
  className,
  onDismiss,
}: WeChatBindQuickEntryProps) {
  const navigate = useNavigate();
  const { isBound, isSubscribed, isEmailUser, isLoading } = useWeChatBindStatus();
  const [dismissed, setDismissed] = useState(false);

  // 不显示的情况：加载中、已绑定、不是邮箱用户、已关闭
  if (isLoading || isBound || !isEmailUser || dismissed) {
    return null;
  }

  const handleBind = () => {
    navigate('/settings?tab=notifications');
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full cursor-pointer hover:bg-primary/15 transition-colors',
          className
        )}
        onClick={handleBind}
      >
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs text-primary font-medium">绑定微信</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'relative p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20',
          className
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground">
              绑定微信，接收智能提醒
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              打卡提醒、情绪报告、专属福利
            </p>
            <Button
              size="sm"
              onClick={handleBind}
              className="mt-3 h-8 text-xs"
            >
              立即绑定
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground">
          <span className="font-medium">微信通知</span>
          <span className="text-muted-foreground ml-1.5 text-xs">绑定后接收智能消息</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleBind}
          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
        >
          立即绑定
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
