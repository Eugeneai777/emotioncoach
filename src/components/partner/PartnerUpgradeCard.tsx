import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerUpgradeCardProps {
  currentLevel: string;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
}

export function PartnerUpgradeCard({ currentLevel, isExpired, daysUntilExpiry }: PartnerUpgradeCardProps) {
  const navigate = useNavigate();

  // 已过期：显示续费引导
  if (isExpired) {
    return (
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-400 to-orange-400">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <span className="text-red-700">
              合伙人资格已过期
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            您的佣金权益已冻结，续费后即可恢复。推荐关系和已有余额不受影响。
          </p>
          
          <Button 
            onClick={() => navigate('/partner/youjin-intro')}
            className="w-full gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            立即续费
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 临近到期（30天内）：优先提示续费
  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    const isUrgent = daysUntilExpiry <= 7;
    return (
      <Card className={`${isUrgent ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'} overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${isUrgent ? 'from-red-400 to-orange-400' : 'from-amber-400 to-orange-400'}`}>
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <span className={isUrgent ? 'text-red-700' : 'text-amber-700'}>
              {isUrgent ? `仅剩 ${daysUntilExpiry} 天到期` : `还有 ${daysUntilExpiry} 天到期`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            {isUrgent 
              ? '请尽快续费，避免佣金权益冻结！续费时可自由选择等级。'
              : '建议提前续费，确保佣金权益不中断。续费时可自由选择等级。'
            }
          </p>
          
          <Button 
            onClick={() => navigate('/partner/youjin-intro')}
            className={`w-full gap-2 bg-gradient-to-r ${isUrgent ? 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600' : 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'} text-white`}
          >
            <RefreshCw className="w-4 h-4" />
            续费 / 切换等级
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // L3 合伙人且未临近到期不显示升级卡片
  if (currentLevel === 'L3') return null;

  // 根据当前等级确定升级目标
  const upgradeInfo = {
    L1: {
      targetLevel: 'L3',
      targetName: '钻石合伙人',
      price: 4950,
      highlight: '50%一级佣金 + 12%二级佣金',
    },
    L2: {
      targetLevel: 'L3',
      targetName: '钻石合伙人',
      price: 4950,
      highlight: '50%一级佣金 + 12%二级佣金',
    },
  }[currentLevel] || null;

  if (!upgradeInfo) return null;

  return (
    <Card className="border-orange-200 bg-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            升级到{upgradeInfo.targetName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          享受{upgradeInfo.highlight}，收益翻倍！
        </p>
        
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-orange-50 px-3 py-2 rounded-lg">
          <TrendingUp className="w-4 h-4" />
          <span>升级需支付等级全价 ¥{upgradeInfo.price.toLocaleString()}</span>
        </div>

        <Button 
          onClick={() => navigate('/partner/youjin-intro')}
          className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          立即升级
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
