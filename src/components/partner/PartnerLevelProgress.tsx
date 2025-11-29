import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Partner } from "@/hooks/usePartner";
import { youjinPartnerLevels } from "@/config/partnerLevels";
import { TrendingUp } from "lucide-react";

interface PartnerLevelProgressProps {
  partner: Partner;
}

export function PartnerLevelProgress({ partner }: PartnerLevelProgressProps) {
  const currentLevelIndex = youjinPartnerLevels.findIndex(l => l.level === partner.partner_level);
  const currentLevel = youjinPartnerLevels[currentLevelIndex];
  const nextLevel = youjinPartnerLevels[currentLevelIndex + 1];

  if (!currentLevel) return null;

  const progress = nextLevel
    ? ((partner.prepurchase_count - currentLevel.minPrepurchase) / 
       (nextLevel.minPrepurchase - currentLevel.minPrepurchase)) * 100
    : 100;

  const remaining = nextLevel ? nextLevel.minPrepurchase - partner.prepurchase_count : 0;

  return (
    <Card className={`border-2 bg-gradient-to-br ${currentLevel.gradient} text-white`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentLevel.icon}</span>
            <div>
              <CardTitle className="text-white">{currentLevel.name}</CardTitle>
              <CardDescription className="text-white/90">
                {currentLevel.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80">当前预购</div>
            <div className="text-3xl font-bold">{partner.prepurchase_count}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {nextLevel ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/90">
                <span>升级进度</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-white/20" />
              <p className="text-sm text-white/80">
                还需预购 <span className="font-bold">{remaining}</span> 份即可升级到 {nextLevel.name}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
              <TrendingUp className="w-4 h-4" />
              <span>升级后佣金提升至 {(nextLevel.commissionRateL1 * 100).toFixed(0)}%</span>
              {nextLevel.commissionRateL2 > 0 && (
                <span>+ 二级 {(nextLevel.commissionRateL2 * 100).toFixed(0)}%</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-white/90">
              🎉 恭喜！您已达到最高等级
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}