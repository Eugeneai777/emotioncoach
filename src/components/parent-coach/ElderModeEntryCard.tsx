import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Info, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ElderMoodReport } from "./ElderMoodReport";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { FamilyPhotoUploader } from "@/components/elder-care/FamilyPhotoUploader";

export function ElderModeEntryCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: userId } = useQuery({
    queryKey: ["current-user-id-elder"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
  });

  // Check if elder has any logs linked to this user
  const { data: hasElderData } = useQuery({
    queryKey: ["elder-has-data", userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from("elder_mood_logs")
        .select("id")
        .eq("child_user_id", userId)
        .limit(1);
      return data && data.length > 0;
    },
    enabled: !!userId,
  });

  const handleCopyLink = async () => {
    if (!userId) return;
    try {
      const url = `${getPromotionDomain()}/elder-care?from=child_${userId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "链接已复制 ✅", description: "发送给爸妈即可" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!userId) return;
    const url = `${getPromotionDomain()}/elder-care?from=child_${userId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "银发陪伴 — 给爸妈一个温暖的AI陪伴入口",
          text: "会聊天、会问候、会提醒、会关怀，简单到长辈一看就懂",
          url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  if (hasElderData) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">长辈的陪伴空间</h3>
                <p className="text-xs text-muted-foreground">银发陪伴已开启</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-emerald-600">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/elder-care")} className="text-emerald-600">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ElderMoodReport />
          <FamilyPhotoUploader />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-emerald-100 via-teal-50 to-green-50 border-0 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-2xl">🌿</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                让爸妈也有AI陪伴
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                银发陪伴模式，为长辈提供聊天、问候、提醒、心情记录
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                  💬 暖心聊天
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                  🔔 智能提醒
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                  🔐 隐私保护
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  分享给爸妈
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="border-emerald-200"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
