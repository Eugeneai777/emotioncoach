import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Crown, Gift, ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CampMilestoneUpgradeProps {
  currentDay: number;
  milestoneReached: 3 | 7 | 14 | 21;
  campName: string;
  onDismiss?: () => void;
}

export function CampMilestoneUpgrade({
  currentDay,
  milestoneReached,
  campName,
  onDismiss
}: CampMilestoneUpgradeProps) {
  const navigate = useNavigate();

  const milestoneConfig = {
    3: {
      icon: Sparkles,
      title: "恭喜完成3天！",
      subtitle: "你已经迈出了坚实的第一步",
      message: "继续坚持，21天后你会看到明显的变化",
      ctaText: "了解365会员",
      ctaAction: () => navigate("/packages"),
      showPartner: false,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50/50 to-cyan-50/50"
    },
    7: {
      icon: Trophy,
      title: "🎉 7天里程碑达成！",
      subtitle: "你已养成初步的情绪觉察习惯",
      message: "升级365会员，解锁更多功能，加速你的成长",
      ctaText: "升级365会员",
      ctaAction: () => navigate("/packages"),
      showPartner: false,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50/50 to-amber-50/50"
    },
    14: {
      icon: Crown,
      title: "🏆 14天成就解锁！",
      subtitle: "你的情绪管理能力正在快速提升",
      message: "365会员享受全部功能 + 1000次AI对话，助力你的持续成长",
      ctaText: "立即升级",
      ctaAction: () => navigate("/packages"),
      showPartner: true,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50/50 to-pink-50/50"
    },
    21: {
      icon: Gift,
      title: "🎊 恭喜毕业！",
      subtitle: "21天财富觉醒训练营完美收官",
      message: "你已经建立了良好的情绪管理习惯！继续保持，或者成为有劲合伙人，帮助更多人",
      ctaText: "查看毕业生专属通道",
      ctaAction: () => navigate("/partner/graduate"),
      showPartner: true,
      gradient: "from-rose-500 to-orange-500",
      bgGradient: "from-rose-50/50 to-orange-50/50"
    }
  };

  const config = milestoneConfig[milestoneReached];
  const Icon = config.icon;

  return (
    <Card className={`border-2 overflow-hidden bg-gradient-to-br ${config.bgGradient}`}>
      {/* 顶部装饰条 */}
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <CardDescription>{config.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {config.message}
        </p>

        {/* 社交证明 - 仅在14天和21天显示 */}
        {(milestoneReached === 14 || milestoneReached === 21) && (
          <div className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
            <div className="flex -space-x-2">
              {['🧑', '👩', '🧔', '👧'].map((emoji, i) => (
                <span key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm border-2 border-white">
                  {emoji}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              已有 <strong className="text-foreground">1,200+</strong> 人完成训练
            </span>
          </div>
        )}

        {/* CTA按钮 */}
        <div className={`flex gap-2 ${config.showPartner ? 'flex-col sm:flex-row' : ''}`}>
          <Button 
            onClick={config.ctaAction}
            className={`flex-1 bg-gradient-to-r ${config.gradient} hover:opacity-90`}
          >
            {config.ctaText}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          
          {config.showPartner && (
            <Button 
              onClick={() => navigate("/partner/youjin-plan")}
              variant="outline"
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-1" />
              成为有劲合伙人
            </Button>
          )}
        </div>

        {/* 毕业证书提示 - 仅在21天显示 */}
        {milestoneReached === 21 && (
          <div className="text-center p-3 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              🎓 恭喜获得「{campName}」毕业证书！
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              可在个人主页查看和分享
            </p>
          </div>
        )}

        {/* 关闭提示 */}
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            稍后再看
          </button>
        )}
      </CardContent>
    </Card>
  );
}
