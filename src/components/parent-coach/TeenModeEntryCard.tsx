import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ArrowRight, 
  Sparkles, 
  Info,
  Heart,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { TeenUsageStats } from "./TeenUsageStats";
import TeenInviteShareDialog from "./TeenInviteShareDialog";

interface TeenModeEntryCardProps {
  hasActiveBinding: boolean;
  bindingData?: {
    teen_nickname: string | null;
    bound_at: string | null;
  };
  onGenerateCode: () => void;
}

export function TeenModeEntryCard({ 
  hasActiveBinding, 
  bindingData,
  onGenerateCode 
}: TeenModeEntryCardProps) {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);

  if (hasActiveBinding && bindingData) {
    // Show usage stats for bound teens
    return (
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {bindingData.teen_nickname || "孩子"}的专属空间
                </h3>
                <p className="text-xs text-muted-foreground">
                  双轨模式已开启
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/parent-teen-intro")}
              className="text-violet-600"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          <TeenUsageStats />
        </CardContent>
      </Card>
    );
  }

  // Show invitation CTA for unbound parents
  return (
    <>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-violet-100 via-purple-50 to-pink-50 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                <Users className="h-7 w-7 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  让孩子也有一个安全角落
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  开启双轨模式，各自在安全空间中成长，亲子关系自然改善
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    隐性桥梁
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                    🔐 绝对隐私
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs">
                    🌱 双向成长
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowShareDialog(true)}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    生成邀请卡片
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/parent-teen-intro")}
                    className="border-violet-200"
                  >
                    了解更多
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <TeenInviteShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
}
