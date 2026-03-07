import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { PartnerCoachManager } from "./PartnerCoachManager";
import { PartnerAssessmentManager } from "./PartnerAssessmentManager";
import { PartnerMarketingHub } from "./PartnerMarketingHub";
import { PartnerPromotionManager } from "./PartnerPromotionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Partner } from "@/hooks/usePartner";

interface IndustryPartnerDashboardProps {
  partner: Partner;
}

export function IndustryPartnerDashboard({ partner }: IndustryPartnerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">行业合伙人</h2>
                <Badge variant="outline" className="text-xs">
                  {partner.partner_code}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                推荐用户: {partner.total_referrals || 0} 人
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="coaches" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="coaches" className="flex-1">AI教练</TabsTrigger>
          <TabsTrigger value="assessments" className="flex-1">测评</TabsTrigger>
          <TabsTrigger value="marketing" className="flex-1">AI文案</TabsTrigger>
          <TabsTrigger value="promotions" className="flex-1">营销</TabsTrigger>
        </TabsList>

        <TabsContent value="coaches">
          <PartnerCoachManager 
            partnerId={partner.id} 
            partnerCode={partner.partner_code} 
          />
        </TabsContent>

        <TabsContent value="assessments">
          <PartnerAssessmentManager 
            partnerId={partner.id} 
            partnerCode={partner.partner_code} 
          />
        </TabsContent>

        <TabsContent value="marketing">
          <PartnerMarketingHub partnerId={partner.id} />
        </TabsContent>

        <TabsContent value="promotions">
          <PartnerPromotionManager 
            partnerId={partner.id} 
            partnerCode={partner.partner_code} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
