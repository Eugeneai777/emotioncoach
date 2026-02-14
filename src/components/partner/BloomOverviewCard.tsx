import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Partner } from "@/hooks/usePartner";
import { TrendingUp, Wallet, Users, UserPlus, ArrowRight } from "lucide-react";

interface BloomOverviewCardProps {
  partner: Partner;
  onWithdraw?: () => void;
}

export function BloomOverviewCard({ partner, onWithdraw }: BloomOverviewCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* 顶部品牌头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦋</span>
            <div>
              <h3 className="font-bold text-lg">绽放合伙人</h3>
              <p className="text-white/80 text-sm">永久有效 · 无需续费</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80">佣金比例</div>
            <div className="text-xl font-bold">
              30%
              <span className="text-sm font-normal ml-1">+10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 核心数据 */}
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 累计收益 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <div className="text-2xl font-bold text-purple-600">
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

          {/* 直推人数 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold text-blue-600">
              {partner.total_referrals}
            </div>
            <div className="text-xs text-muted-foreground">直推人数</div>
          </div>

          {/* 二级人数 */}
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
            <UserPlus className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <div className="text-2xl font-bold text-amber-600">
              {partner.total_l2_referrals}
            </div>
            <div className="text-xs text-muted-foreground">二级人数</div>
          </div>
        </div>

        {/* 可提现快捷操作 */}
        {partner.available_balance > 0 && (
          <Button
            onClick={onWithdraw}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
