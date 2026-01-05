import { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, Star, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import WealthInviteCardDialog from './WealthInviteCardDialog';

interface WealthCampInviteCardProps {
  campId?: string;
  dayNumber: number;
  userId: string;
  inviteCount?: number;
  onInviteClick?: () => void;
}

// 邀请奖励规则
const INVITE_REWARDS = [
  { count: 1, reward: '解锁专属冥想音频', icon: '🎵' },
  { count: 3, reward: '获得1对1教练咨询机会', icon: '💬' },
  { count: 5, reward: '解锁进阶财富课程', icon: '📚' },
  { count: 10, reward: '成为认证财富教练学员', icon: '🏅' },
];

export function WealthCampInviteCard({ 
  campId, 
  dayNumber, 
  userId,
  inviteCount = 0,
  onInviteClick
}: WealthCampInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const inviteUrl = `${window.location.origin}/claim?type=wealth_camp&ref=${userId}`;

  // 计算下一个奖励目标
  const nextReward = INVITE_REWARDS.find(r => r.count > inviteCount);
  const currentReward = INVITE_REWARDS.filter(r => r.count <= inviteCount).pop();
  const progress = nextReward 
    ? (inviteCount / nextReward.count) * 100 
    : 100;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "链接已复制",
        description: "分享给好友一起突破财富卡点",
      });
      setTimeout(() => setCopied(false), 2000);
      // 触发完成回调
      onInviteClick?.();
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请手动复制链接",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '21天突破财富卡点训练营',
          text: `我正在参加21天财富卡点训练营，已经坚持${dayNumber}天了！邀请你一起加入，突破财富障碍~`,
          url: inviteUrl,
        });
        // 分享成功，触发完成回调
        onInviteClick?.();
      } catch (error) {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-base">
          <span>🎁</span> 邀请好友一起突破
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 邀请统计 */}
        <div className="flex items-center justify-between bg-white/60 dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {inviteCount}
              </div>
              <div className="text-xs text-amber-600/80 dark:text-amber-400/80">
                已邀请好友
              </div>
            </div>
          </div>
          {currentReward && (
            <div className="text-right">
              <div className="text-lg">{currentReward.icon}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                已获得
              </div>
            </div>
          )}
        </div>

        {/* 奖励进度 */}
        {nextReward && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Gift className="w-4 h-4" />
                下一个奖励
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {inviteCount}/{nextReward.count} 人
              </span>
            </div>
            <div className="h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <span>{nextReward.icon}</span>
              <span>{nextReward.reward}</span>
            </div>
          </div>
        )}

        {/* 所有奖励预览 */}
        <div className="grid grid-cols-4 gap-2">
          {INVITE_REWARDS.map((reward, index) => (
            <div
              key={reward.count}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg text-center transition-all",
                inviteCount >= reward.count
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  : "bg-white/30 dark:bg-black/10 text-muted-foreground"
              )}
            >
              <span className="text-xl">{reward.icon}</span>
              <span className="text-xs mt-1">{reward.count}人</span>
              {inviteCount >= reward.count && (
                <Check className="w-3 h-3 text-amber-600 mt-1" />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-amber-700 dark:text-amber-300">
          你已完成 <strong>{dayNumber}</strong> 天训练，邀请好友一起成长！
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享邀请
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <WealthInviteCardDialog
          defaultTab="camp"
          onGenerate={onInviteClick}
          campId={campId}
          currentDay={dayNumber}
          trigger={
            <Button
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 gap-2"
            >
              <Image className="w-4 h-4" />
              生成邀请卡片
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
