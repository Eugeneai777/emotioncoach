import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Partner } from "@/hooks/usePartner";
import { getPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels";
import { TrendingUp, Wallet, Users, Gift, ArrowRight, Clock, AlertTriangle } from "lucide-react";
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

  const getExpiryDisplay = () => {
    if (!partner.partner_expires_at) return null;
    
    if (isExpired) {
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
        text: '合伙人资格已过期',
        subtext: '续费后恢复佣金权益',
        showRenewButton: true,
      };
    }
    
    if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
        text: `即将到期，还剩 ${daysUntilExpiry} 天`,
        subtext: '请尽快续费',
        showRenewButton: true,
      };
    }
    
    if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
      return {
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
        text: `还有 ${daysUntilExpiry} 天到期`,
        subtext: '建议提前续费',
        showRenewButton: true,
      };
    }
    
    return {
      color: 'text-muted-foreground bg-muted/50 border-border',
      icon: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
      text: `有效期至 ${new Date(partner.partner_expires_at).toLocaleDateString()}`,
      subtext: null,
      showRenewButton: false,
    };
  };

  const expiryDisplay = getExpiryDisplay();

  return (
    <div className="rounded-2xl border-0 shadow-lg overflow-hidden">
      {/* 顶部等级条 */}
      <div className={`bg-gradient-to-r ${currentLevel?.gradient || 'from-orange-500 to-amber-500'} p-3 text-white ${isExpired ? 'opacity-75' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentLevel?.icon || '💪'}</span>
            <div>
              <h3 className="font-bold text-sm">
                有劲合伙人 · {currentLevel?.name || 'L1'}
                {isExpired && <span className="ml-2 text-xs font-normal bg-white/20 px-1.5 py-0.5 rounded">已过期</span>}
              </h3>
              <p className="text-white/80 text-xs">
                {isExpired ? (
                  <>续费后恢复佣金权益</>
                ) : nextLevel ? (
                  <>还需 {remaining} 预购升级</>
                ) : (
                  <>最高等级</>
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

      {/* 到期状态提示 */}
      {expiryDisplay && (
        <div className={`mx-3 mt-3 p-2 rounded-lg border ${expiryDisplay.color} flex items-center justify-between`}>
          <div className="flex items-center gap-1.5 flex-1">
            {expiryDisplay.icon}
            <div>
              <p className="text-xs font-medium">{expiryDisplay.text}</p>
              {expiryDisplay.subtext && (
                <p className="text-[10px] opacity-80">{expiryDisplay.subtext}</p>
              )}
            </div>
          </div>
          {expiryDisplay.showRenewButton && (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-2 shrink-0 h-7 text-xs"
              onClick={() => navigate('/partner/youjin-intro')}
            >
              {isExpired ? '续费' : '去续费'}
            </Button>
          )}
        </div>
      )}

      {/* 核心数据 - 统一橙色系 */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <TrendingUp className="w-4 h-4 mx-auto text-orange-500 mb-0.5" />
            <div className="text-lg font-bold text-orange-600">
              ¥{partner.total_earnings.toFixed(0)}
            </div>
            <div className="text-[10px] text-muted-foreground">累计收益</div>
          </div>

          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Wallet className="w-4 h-4 mx-auto text-orange-500 mb-0.5" />
            <div className="text-lg font-bold text-orange-600">
              ¥{partner.available_balance.toFixed(0)}
            </div>
            <div className="text-[10px] text-muted-foreground">可提现</div>
          </div>

          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Users className="w-4 h-4 mx-auto text-orange-500 mb-0.5" />
            <div className="text-lg font-bold text-orange-600">
              {partner.total_referrals}
            </div>
            <div className="text-[10px] text-muted-foreground">直推用户</div>
          </div>

          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Gift className="w-4 h-4 mx-auto text-orange-500 mb-0.5" />
            <div className="text-lg font-bold text-orange-600">
              {partner.prepurchase_count}
            </div>
            <div className="text-[10px] text-muted-foreground">剩余名额</div>
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
