import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

  const inviteUrl = `${window.location.origin}/claim?type=wealth_camp_7&ref=${userId}`;

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
    <Card className="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2 text-base">
          <span>🎁</span> 邀请好友一起突破
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          你已完成 <strong>第 {dayNumber} 天</strong> 训练，邀请好友一起成长！
        </p>

        <Button
          onClick={handleCopyLink}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? '已复制' : '复制邀请链接'}
        </Button>
      </CardContent>
    </Card>
  );
}
