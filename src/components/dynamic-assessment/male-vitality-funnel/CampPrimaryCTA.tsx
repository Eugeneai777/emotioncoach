import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Props {
  checkedCount: number;
  onShare: () => void;
  isSharing?: boolean;
}

export function CampPrimaryCTA({ checkedCount, onShare, isSharing }: Props) {
  const navigate = useNavigate();
  const headline =
    checkedCount > 0
      ? `你刚勾的 ${checkedCount} 件事,生命教练陪你做 7 天`
      : "你刚看到的 3 件事,生命教练陪你做 7 天";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
      <Card className="border-primary/30 bg-gradient-to-br from-teal-700 via-teal-600 to-amber-600 text-white shadow-lg shadow-teal-700/25 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">🔋</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base leading-snug">{headline}</h3>
              <p className="text-xs leading-relaxed mt-1 text-white/90">
                靠自己坚持 7 天的概率不到 12%。生命教练带过 3000+ 个像你这样的兄弟,陪你打卡 7 天,把电量一点点充回来。
              </p>
            </div>
          </div>
          <Button
            className="w-full h-11 rounded-xl gap-2 bg-white text-teal-700 hover:bg-white/95 font-semibold"
            onClick={() => navigate("/camp-intro/emotion_stress_7")}
          >
            了解 7 天有劲训练营 <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={onShare}
        disabled={isSharing}
        className="w-full h-11 gap-2 rounded-xl border-teal-300/60 dark:border-teal-700/50 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"
      >
        <Share2 className="w-4 h-4" /> 生成我的有劲状态报告海报
      </Button>
    </motion.div>
  );
}
