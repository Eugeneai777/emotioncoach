import { useState } from 'react';
import { Share2, Link, Copy, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WealthCampInviteCardProps {
  campId?: string;
  dayNumber: number;
  userId: string;
  inviteCount?: number;
}

export function WealthCampInviteCard({ 
  campId, 
  dayNumber, 
  userId,
  inviteCount = 0 
}: WealthCampInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const inviteUrl = `${window.location.origin}/claim?type=wealth_camp&ref=${userId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "链接已复制",
        description: "分享给好友一起突破财富卡点",
      });
      setTimeout(() => setCopied(false), 2000);
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
      } catch (error) {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-base">
          <span>🎁</span> 邀请好友一起突破
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {inviteCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <Users className="w-4 h-4" />
            <span>已邀请 {inviteCount} 人加入训练营</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
