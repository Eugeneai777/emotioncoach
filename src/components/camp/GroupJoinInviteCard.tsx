import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, Clock, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GroupJoinInviteCardProps {
  referralId: string;
  partnerName?: string;
  groupName?: string;
  groupQrCodeUrl?: string;
  hasJoined: boolean;
  onJoinStatusChange?: () => void;
}

export function GroupJoinInviteCard({
  referralId,
  partnerName = "有劲合伙人",
  groupName = "有劲学员群",
  groupQrCodeUrl,
  hasJoined,
  onJoinStatusChange
}: GroupJoinInviteCardProps) {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(hasJoined);

  const handleJoinConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('partner_referrals')
        .update({
          has_joined_group: true,
          joined_group_at: new Date().toISOString(),
          conversion_status: 'joined_group'
        })
        .eq('id', referralId);

      if (error) throw error;

      setJoined(true);
      toast.success("太棒了！欢迎加入学员群 🎉");
      onJoinStatusChange?.();
    } catch (error) {
      console.error("Update join status error:", error);
      toast.error("更新状态失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-700">已加入 {groupName}</p>
              <p className="text-xs text-green-600">在群内获得更多学习资源和同伴支持</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!groupQrCodeUrl) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            加入学员群
          </CardTitle>
          <Badge className="bg-orange-100 text-orange-700 border-0">推荐</Badge>
        </div>
        <CardDescription className="text-xs">
          扫码加入{partnerName}的学员群，获得同伴支持
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 群二维码 */}
        <div className="flex justify-center">
          <div className="p-3 bg-white rounded-lg shadow-sm border">
            <img 
              src={groupQrCodeUrl} 
              alt="学员群二维码" 
              className="w-40 h-40 object-contain"
            />
          </div>
        </div>

        {/* 群名称 */}
        <p className="text-center text-sm text-muted-foreground">
          {groupName}
        </p>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button 
            onClick={handleJoinConfirm}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            disabled={loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            我已加群
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => toast.info("记得稍后加群哦，群里有很多学习资源！")}
          >
            <Clock className="w-4 h-4 mr-1" />
            稍后加群
          </Button>
        </div>

        {/* 提示 */}
        <p className="text-xs text-muted-foreground text-center">
          💡 群内有情绪管理分享、互助答疑、专属福利
        </p>
      </CardContent>
    </Card>
  );
}
