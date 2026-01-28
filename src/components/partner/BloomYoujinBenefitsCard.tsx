import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, TrendingUp, QrCode, ArrowRight } from "lucide-react";
import { Partner } from "@/hooks/usePartner";
import { useNavigate } from "react-router-dom";
import { EntryTypeSelector } from "./EntryTypeSelector";
import { useState } from "react";

interface BloomYoujinBenefitsCardProps {
  partner: Partner;
}

export function BloomYoujinBenefitsCard({ partner }: BloomYoujinBenefitsCardProps) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            有劲推广权益
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
            💪 初级合伙人
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          作为绽放合伙人，您自动拥有有劲初级合伙人权益
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 权益说明 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">佣金比例</span>
            </div>
            <p className="text-lg font-bold text-orange-600">18%</p>
            <p className="text-xs text-muted-foreground">有劲产品一级佣金</p>
          </div>
          <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">体验包</span>
            </div>
            <p className="text-lg font-bold text-orange-600">
              {partner.prepurchase_count || 100}
            </p>
            <p className="text-xs text-muted-foreground">可分发名额</p>
          </div>
        </div>

        {/* 入口类型设置 */}
        <EntryTypeSelector 
          partnerId={partner.id}
          currentEntryType={partner.default_entry_type || 'free'}
          prepurchaseCount={partner.prepurchase_count || 100}
          onUpdate={() => setRefreshKey(k => k + 1)}
        />

        {/* 查看完整权益 */}
        <Button 
          variant="outline" 
          className="w-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          onClick={() => navigate("/partner/youjin-plan")}
        >
          <QrCode className="w-4 h-4" />
          查看有劲合伙人完整权益
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
