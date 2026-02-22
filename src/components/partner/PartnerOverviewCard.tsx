import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Partner } from "@/hooks/usePartner";
import { getPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels";
import { Wallet, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompactConversionFunnel } from "./CompactConversionFunnel";

interface PartnerOverviewCardProps {
  partner: Partner;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
  onWithdraw?: () => void;
  onStudentsClick?: () => void;
}

export function PartnerOverviewCard({ partner, isExpired, daysUntilExpiry, onWithdraw, onStudentsClick }: PartnerOverviewCardProps) {
  const navigate = useNavigate();
  const currentLevel = getPartnerLevel('youjin', partner.partner_level);
  const currentLevelIndex = youjinPartnerLevels.findIndex(l => l.level === partner.partner_level);
  const nextLevel = youjinPartnerLevels[currentLevelIndex + 1];

  const progress = nextLevel
    ? ((partner.prepurchase_count - (currentLevel?.minPrepurchase || 0)) / 
       (nextLevel.minPrepurchase - (currentLevel?.minPrepurchase || 0))) * 100
    : 100;

  const remaining = nextLevel ? nextLevel.minPrepurchase - partner.prepurchase_count : 0;

  // 到期信息内联到等级条副标题
  const getSubtitleContent = () => {
    if (isExpired) {
      return { text: '已过期 · 续费后恢复佣金权益', urgent: true };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry <= 7) {
      return { text: `还剩 ${daysUntilExpiry} 天到期 · 请尽快续费`, urgent: true };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry <= 30) {
      return { text: `还有 ${daysUntilExpiry} 天到期 · 建议提前续费`, urgent: false };
    }
    if (nextLevel) {
      return { text: `还需 ${remaining} 预购升级`, urgent: false };
    }
    return { text: '最高等级', urgent: false };
  };

  const subtitle = getSubtitleContent();
  const showRenewButton = isExpired || (daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry <= 30);

  return (
    <div className="rounded-2xl border-0 shadow-lg overflow-hidden">
      {/* 顶部等级条 */}
      <div className={`bg-gradient-to-r ${currentLevel?.gradient || 'from-orange-500 to-amber-500'} p-3 text-white ${isExpired ? 'opacity-75' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentLevel?.icon || '💪'}</span>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                有劲合伙人 · {currentLevel?.name || 'L1'}
                {isExpired && <span className="text-xs font-normal bg-white/20 px-1.5 py-0.5 rounded">已过期</span>}
              </h3>
              <p className="text-white/80 text-xs flex items-center gap-1">
                {subtitle.urgent && (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {subtitle.text}
                {showRenewButton && (
                  <button 
                    onClick={() => navigate('/partner/youjin-intro')}
                    className="underline ml-1 hover:text-white"
                  >
                    {isExpired ? '续费' : '去续费'}
                  </button>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/80">佣金比例</div>
            <div className="text-lg font-bold">
              {((currentLevel?.commissionRateL1 || 0.2) * 100).toFixed(0)}%
              {currentLevel?.commissionRateL2 > 0 && (
                <span className="text-xs font-normal ml-1">
                  +{(currentLevel.commissionRateL2 * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {nextLevel && !isExpired && (
          <div className="mt-2">
            <Progress value={progress} className="h-1.5 bg-white/20" />
          </div>
        )}
      </div>

      {/* 核心数据 - 2x2 紧凑布局 */}
      <div className="p-3">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-orange-600">¥{partner.total_earnings.toFixed(0)}</span>
              <span className="text-[10px] text-muted-foreground">累计收益</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-orange-600">¥{partner.available_balance.toFixed(0)}</span>
              <span className="text-[10px] text-muted-foreground">可提现</span>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-orange-600">{partner.total_referrals}</span>
              <span className="text-[10px] text-muted-foreground">直推用户</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-orange-600">{partner.prepurchase_count}</span>
              <span className="text-[10px] text-muted-foreground">剩余名额</span>
            </div>
          </div>
        </div>

        {/* 可提现快捷操作 */}
        {partner.available_balance > 0 && (
          <Button 
            onClick={onWithdraw}
            size="sm"
            className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            立即提现 ¥{partner.available_balance.toFixed(2)}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}

        {/* 内嵌转化漏斗 */}
        <div className="mt-2">
          <CompactConversionFunnel 
            partnerId={partner.id} 
            onClick={onStudentsClick}
          />
        </div>
      </div>
    </div>
  );
}
