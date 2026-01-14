import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Gift, MessageCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { useFollowReminder, TriggerKey } from '@/hooks/useFollowReminder';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Detect WeChat environment
function isWechatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

// Trigger messages based on context - only key moments
const TRIGGER_MESSAGES: Record<TriggerKey, { title: string; subtitle: string }> = {
  after_purchase: {
    title: '🎉 订阅成功！',
    subtitle: '关注公众号接收课程提醒和专属福利',
  },
  after_coach: {
    title: '💬 对话有收获？',
    subtitle: '关注公众号，明天收到个性化成长提醒',
  },
  after_journal: {
    title: '📝 记录成功！',
    subtitle: '关注公众号，接收每日感恩提醒',
  },
  after_checkin: {
    title: '✅ 打卡成功！',
    subtitle: '关注公众号，不错过明天的训练',
  },
  manual: {
    title: '📱 关注公众号',
    subtitle: '开启智能提醒和专属福利',
  },
};

export function FollowWechatReminder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    shouldShowReminder,
    triggerKey,
    hideReminder,
    markAsFollowed,
    markAsLater,
    showReminder,
  } = useFollowReminder();

  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isWechat = isWechatBrowser();

  // Sync with hook state
  useEffect(() => {
    setIsOpen(shouldShowReminder);
  }, [shouldShowReminder]);

  // Listen for external trigger events
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ trigger: TriggerKey }>) => {
      if (user) {
        showReminder(event.detail.trigger);
      }
    };

    window.addEventListener('trigger-follow-reminder', handleTrigger as EventListener);
    return () => {
      window.removeEventListener('trigger-follow-reminder', handleTrigger as EventListener);
    };
  }, [user, showReminder]);

  const handleClose = () => {
    setIsOpen(false);
    hideReminder();
  };

  const handleFollowed = async () => {
    setSyncing(true);
    try {
      // 标记为已关注
      await markAsFollowed();
      
      // 尝试同步微信用户信息
      if (user) {
        const { data, error } = await supabase.functions.invoke('check-wechat-subscribe-status');
        
        if (!error && data?.subscribed && data?.nickname && data.nickname !== '微信用户') {
          // 如果已关注且有真实昵称，更新本地 profiles
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              display_name: data.nickname,
              avatar_url: data.avatar_url || null,
            })
            .eq('id', user.id);

          if (!updateError) {
            toast({
              title: '信息已同步',
              description: `已同步微信昵称: ${data.nickname}`,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error syncing WeChat info:', err);
    } finally {
      setSyncing(false);
      setIsOpen(false);
    }
  };

  const handleLater = async () => {
    await markAsLater();
    setIsOpen(false);
  };

  // Don't render if no user
  if (!user) return null;

  const message = triggerKey ? TRIGGER_MESSAGES[triggerKey] : TRIGGER_MESSAGES.manual;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md mx-auto" hideCloseButton>
        <DialogHeader className="space-y-2 text-center relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-lg font-semibold">{message.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{message.subtitle}</p>
        </DialogHeader>

        {/* QR Code - Key element */}
        <Card className="p-4 bg-white dark:bg-card">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/wechat-official-qr.png"
              alt="公众号二维码"
              className="w-44 h-44 rounded-lg"
              onError={(e) => {
                // Fallback if image doesn't exist
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <p className="text-sm text-muted-foreground text-center">
              {isWechat ? '长按识别二维码关注' : '微信扫码关注「有劲情绪日记」'}
            </p>
          </div>
        </Card>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">关注后可获得：</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Bell className="w-4 h-4 text-teal-500" />
              <span>打卡提醒</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>专属福利</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span>情绪简报</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>成长报告</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleFollowed}
            disabled={syncing}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#06AD56] hover:to-[#059849] text-white"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {syncing ? '同步中...' : '已关注'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleLater}
            className="w-full text-muted-foreground"
          >
            稍后关注
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
