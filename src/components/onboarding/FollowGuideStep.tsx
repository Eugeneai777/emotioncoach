import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Bell, Gift } from 'lucide-react';

interface FollowGuideStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function FollowGuideStep({ onComplete, onSkip }: FollowGuideStepProps) {
  const [hasFollowed, setHasFollowed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold">关注公众号</h3>
        <p className="text-sm text-muted-foreground">
          关注后可接收重要通知和专属福利
        </p>
      </div>

      {/* 公众号二维码 */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col items-center gap-3">
          <img 
            src="/wechat-official-qr.png" 
            alt="公众号二维码"
            className="w-40 h-40"
            onError={(e) => {
              // 如果图片不存在，显示占位图
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <p className="text-sm text-muted-foreground">
            微信扫码关注「有劲情绪日记」
          </p>
        </div>
      </Card>

      {/* 关注福利 */}
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

      <div className="space-y-2">
        <Button
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          已关注，开始使用
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          稍后关注
        </Button>
      </div>
    </div>
  );
}
