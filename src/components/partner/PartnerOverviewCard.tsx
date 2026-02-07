import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Partner } from "@/hooks/usePartner";
import { getPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels";
import { TrendingUp, Wallet, Users, Gift, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerOverviewCardProps {
  partner: Partner;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
  onWithdraw?: () => void;
}

export function PartnerOverviewCard({ partner, isExpired, daysUntilExpiry, onWithdraw }: PartnerOverviewCardProps) {
  const navigate = useNavigate();
  const currentLevel = getPartnerLevel('youjin', partner.partner_level);
  const currentLevelIndex = youjinPartnerLevels.findIndex(l => l.level === partner.partner_level);
  const nextLevel = youjinPartnerLevels[currentLevelIndex + 1];

  const progress = nextLevel
    ? ((partner.prepurchase_count - (currentLevel?.minPrepurchase || 0)) / 
       (nextLevel.minPrepurchase - (currentLevel?.minPrepurchase || 0))) * 100
    : 100;

  const remaining = nextLevel ? nextLevel.minPrepurchase - partner.prepurchase_count : 0;

  // 到期状态样式
  const getExpiryDisplay = () => {
    if (!partner.partner_expires_at) return null; // 永久有效（绽放合伙人）
    
    if (isExpired) {
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        text: '合伙人资格已过期',
        subtext: '佣金权益已冻结，续费后恢复',
        showRenewButton: true,
      };
    }
    
    if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        text: `即将到期，还剩 ${daysUntilExpiry} 天`,
        subtext: '请尽快续费，避免佣金权益冻结',
        showRenewButton: true,
      };
    }
    
    if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
      return {
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: <Clock className="w-4 h-4 text-amber-500" />,
        text: `还有 ${daysUntilExpiry} 天到期`,
        subtext: '建议提前续费，确保佣金权益不中断',
        showRenewButton: true,
      };
    }
    
    return {
      color: 'text-green-700 bg-green-50 border-green-200',
      icon: <Clock className="w-4 h-4 text-green-500" />,
      text: `有效期至 ${new Date(partner.partner_expires_at).toLocaleDateString()}`,
      subtext: null,
      showRenewButton: false,
    };
  };

  const expiryDisplay = getExpiryDisplay();

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* 顶部等级条 */}
      <div className={`bg-gradient-to-r ${currentLevel?.gradient || 'from-orange-500 to-amber-500'} p-4 text-white ${isExpired ? 'opacity-75' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentLevel?.icon || '💪'}</span>
            <div>
              <h3 className="font-bold text-lg">
                有劲合伙人 · {currentLevel?.name || 'L1'}
                {isExpired && <span className="ml-2 text-sm font-normal bg-white/20 px-2 py-0.5 rounded">已过期</span>}
              </h3>
              <p className="text-white/80 text-sm">
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
            <div className="text-sm text-white/80">佣金比例</div>
            <div className="text-xl font-bold">
              {((currentLevel?.commissionRateL1 || 0.2) * 100).toFixed(0)}%
              {currentLevel?.commissionRateL2 > 0 && (
                <span className="text-sm font-normal ml-1">
                  +{(currentLevel.commissionRateL2 * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 升级进度条 */}
        {nextLevel && !isExpired && (
          <div className="mt-3">
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        )}
      </div>

      {/* 到期状态提示 */}
      {expiryDisplay && (
        <div className={`mx-4 mt-4 p-3 rounded-lg border ${expiryDisplay.color} flex items-center justify-between`}>
          <div className="flex items-center gap-2 flex-1">
            {expiryDisplay.icon}
            <div>
              <p className="text-sm font-medium">{expiryDisplay.text}</p>
              {expiryDisplay.subtext && (
                <p className="text-xs opacity-80">{expiryDisplay.subtext}</p>
              )}
            </div>
          </div>
          {expiryDisplay.showRenewButton && (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-3 shrink-0"
              onClick={() => navigate('/partner/youjin-intro')}
            >
              {isExpired ? '立即续费' : '去续费'}
            </Button>
          )}
        </div>
      )}

      {/* 核心数据 */}
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 累计收益 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
            <TrendingUp className="w-5 h-5 mx-auto text-orange-500 mb-1" />
            <div className="text-2xl font-bold text-orange-600">
              ¥{partner.total_earnings.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">累计收益</div>
          </div>

          {/* 可提现 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <Wallet className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold text-green-600">
              ¥{partner.available_balance.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">可提现</div>
          </div>

          {/* 直推用户 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold text-blue-600">
              {partner.total_referrals}
            </div>
            <div className="text-xs text-muted-foreground">直推用户</div>
          </div>

          {/* 剩余名额 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <Gift className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <div className="text-2xl font-bold text-purple-600">
              {partner.prepurchase_count}
            </div>
            <div className="text-xs text-muted-foreground">剩余名额</div>
          </div>
        </div>

        {/* 可提现快捷操作 */}
        {partner.available_balance > 0 && (
          <Button 
            onClick={onWithdraw}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Wallet className="w-4 h-4 mr-2" />
            立即提现 ¥{partner.available_balance.toFixed(2)}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
