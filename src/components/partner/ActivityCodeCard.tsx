import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, ChevronRight, Sparkles } from "lucide-react";
import { RedemptionCodeManager } from "./RedemptionCodeManager";

interface ActivityCodeCardProps {
  partnerId: string;
  availableCount?: number;
  freeCount?: number;
  paidCount?: number;
}

export function ActivityCodeCard({ 
  partnerId, 
  availableCount = 0,
  freeCount = 0,
  paidCount = 0
}: ActivityCodeCardProps) {
  const [showManager, setShowManager] = useState(false);

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-amber-100 hover:border-amber-200 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="text-amber-800">活动兑换码</span>
            <span className="text-xs text-muted-foreground font-normal">可选</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 统计 */}
          <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="space-y-1">
              <p className="text-sm text-amber-700">
                当前可用 <span className="font-bold text-lg">{availableCount}</span> 个
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>🆓 免费 {freeCount}</span>
                <span>💰 付费 {paidCount}</span>
              </div>
            </div>
            {availableCount > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                <Sparkles className="w-3 h-3 mr-1" />
                可用
              </Badge>
            )}
          </div>

          {/* 管理按钮 */}
          <Button 
            onClick={() => setShowManager(true)}
            variant="outline"
            className="w-full justify-between border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <span>管理兑换码</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* 说明 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ 一次性使用，用完作废</p>
            <p>✓ 可单独设置每个码的入口类型</p>
            <p>✓ 适合特殊活动、限时促销</p>
          </div>
        </CardContent>
      </Card>

      <RedemptionCodeManager
        open={showManager}
        onOpenChange={setShowManager}
        partnerId={partnerId}
      />
    </>
  );
}
