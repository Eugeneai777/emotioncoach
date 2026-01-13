import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWeChatBindStatus } from '@/hooks/useWeChatBindStatus';
import { Bell, MessageSquare, Gift, TrendingUp, X } from 'lucide-react';

interface WeChatBindOnboardingProps {
  onClose?: () => void;
}

export function WeChatBindOnboarding({ onClose }: WeChatBindOnboardingProps) {
  const navigate = useNavigate();
  const { needsBindPrompt, isLoading, markPrompted, isBound } = useWeChatBindStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 仅在需要提示且未绑定时显示
    if (!isLoading && needsBindPrompt && !isBound) {
      // 延迟显示，避免页面加载时立即弹出
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, needsBindPrompt, isBound]);

  const handleBindNow = async () => {
    await markPrompted();
    setOpen(false);
    onClose?.();
    navigate('/settings?tab=notifications');
  };

  const handleRemindLater = async () => {
    // 标记为已提示，但7天后可再次提示
    await markPrompted();
    setOpen(false);
    onClose?.();
  };

  const handleNeverRemind = async () => {
    // 标记为永久不提示（通过设置 wechat_bind_prompted = true）
    await markPrompted();
    setOpen(false);
    onClose?.();
  };

  const benefits = [
    {
      icon: Bell,
      title: '消息提醒',
      description: '不错过重要通知和打卡提醒',
    },
    {
      icon: MessageSquare,
      title: '情绪报告',
      description: '接收个性化情绪分析报告',
    },
    {
      icon: TrendingUp,
      title: '成长记录',
      description: '每周成长回顾和里程碑',
    },
    {
      icon: Gift,
      title: '专属福利',
      description: '第一时间获取活动通知',
    },
  ];

  if (isLoading || !needsBindPrompt || isBound) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            绑定微信，体验更完整
          </DialogTitle>
          <DialogDescription className="text-center">
            绑定微信公众号，获取智能消息推送
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 text-center"
              >
                <benefit.icon className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">{benefit.title}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {benefit.description}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleBindNow} className="w-full">
              立即绑定
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRemindLater}
                className="flex-1 text-sm"
              >
                稍后提醒
              </Button>
              <Button
                variant="ghost"
                onClick={handleNeverRemind}
                className="flex-1 text-sm text-muted-foreground"
              >
                不再提示
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
