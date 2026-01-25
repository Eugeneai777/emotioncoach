import { useState, useEffect } from 'react';
import { Copy, Check, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { taskCardStyles, cardBaseStyles } from '@/config/cardStyleConfig';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useOneClickShare } from '@/hooks/useOneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
import WealthCampShareCard from './WealthCampShareCard';

interface WealthCampInviteCardProps {
  campId?: string;
  dayNumber: number;
  userId: string;
}

export function WealthCampInviteCard({ 
  campId, 
  dayNumber, 
  userId
}: WealthCampInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const {
    isSharing,
    previewImageUrl,
    showImagePreview,
    userInfo,
    partnerInfo,
    cardRef,
    triggerShare,
    closePreview,
    preloadUserData,
  } = useOneClickShare({
    cardType: 'camp',
    campId,
    currentDay: dayNumber,
  });

  // Preload user data on mount for instant sharing
  useEffect(() => {
    preloadUserData();
  }, [preloadUserData]);

  const inviteUrl = `${getPromotionDomain()}/claim?type=wealth_camp_7&ref=${userId}`;

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

  return (
    <>
      <Card className={cn(
        "overflow-hidden",
        cardBaseStyles.container,
        taskCardStyles.invite.container
      )}>
        <CardHeader className={cn(
          "pb-2",
          taskCardStyles.invite.header,
          taskCardStyles.invite.headerBorder
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2 text-base",
            taskCardStyles.invite.headerText
          )}>
            <span>🎁</span> 邀请好友一起突破
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            你已完成 <strong>第 {dayNumber} 天</strong> 训练，邀请好友一起成长！
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? '已复制' : '复制链接'}
            </Button>

            <Button
              onClick={triggerShare}
              disabled={isSharing}
              className={cn("flex-1 text-white gap-2", taskCardStyles.invite.badge, "hover:bg-violet-600")}
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Image className="w-4 h-4" />
              )}
              {isSharing ? '生成中...' : '邀请好友'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden card for screenshot capture */}
      <div 
        className="fixed -left-[9999px] top-0 pointer-events-none"
        style={{ opacity: 0.01 }}
        aria-hidden="true"
      >
        <WealthCampShareCard
          ref={cardRef}
          avatarUrl={userInfo.avatarUrl}
          displayName={userInfo.displayName}
          currentDay={dayNumber}
          totalDays={7}
          partnerInfo={partnerInfo || undefined}
        />
      </div>

      {/* Image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={closePreview}
        imageUrl={previewImageUrl}
      />
    </>
  );
}
