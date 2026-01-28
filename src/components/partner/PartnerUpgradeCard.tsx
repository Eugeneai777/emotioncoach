import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerUpgradeCardProps {
  currentLevel: string;
}

export function PartnerUpgradeCard({ currentLevel }: PartnerUpgradeCardProps) {
  const navigate = useNavigate();

  // L3 合伙人不显示升级卡片
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
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 overflow-hidden">
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
        
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100/50 px-3 py-2 rounded-lg">
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
