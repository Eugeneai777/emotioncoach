import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { PartnerCoachManager } from "./PartnerCoachManager";
import { PartnerTeamManager } from "@/components/admin/industry-partners/PartnerTeamManager";
import { PartnerAssessmentManager } from "./PartnerAssessmentManager";
import { PartnerAssessmentAnalytics } from "./PartnerAssessmentAnalytics";
import { PartnerMarketingHub } from "./PartnerMarketingHub";
import { PartnerPromotionManager } from "./PartnerPromotionManager";
import { PartnerChannelAttribution } from "./PartnerChannelAttribution";
import { PartnerFollowupReminders } from "./PartnerFollowupReminders";
import { PartnerTrainingCenter } from "./PartnerTrainingCenter";
import { PartnerSharedDataDashboard } from "./PartnerSharedDataDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Partner } from "@/hooks/usePartner";

interface IndustryPartnerDashboardProps {
  partner: Partner;
}

const TAB_GROUPS = [
  {
    key: "content",
    label: "内容建设",
    tabs: [
      { value: "coaches", label: "AI教练" },
      { value: "assessments", label: "测评" },
      { value: "assessment-analytics", label: "测评分析" },
    ],
  },
  {
    key: "marketing",
    label: "营销获客",
    tabs: [
      { value: "marketing", label: "AI文案" },
      { value: "promotions", label: "营销活动" },
      { value: "channels", label: "渠道归因" },
    ],
  },
  {
    key: "crm",
    label: "客户运营",
    tabs: [
      { value: "reminders", label: "跟进提醒" },
      { value: "training", label: "培训中心" },
      { value: "data-dashboard", label: "数据看板" },
    ],
  },
  {
    key: "team",
    label: "团队管理",
    tabs: [
      { value: "team-members", label: "团队成员" },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

function getGroupForTab(tabValue: string) {
  return TAB_GROUPS.find((g) => g.tabs.some((t) => t.value === tabValue))?.key || TAB_GROUPS[0].key;
}

export function IndustryPartnerDashboard({ partner }: IndustryPartnerDashboardProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("coaches");
  const [activeGroup, setActiveGroup] = useState("content");

  // Sync group when tab changes
  const correctGroup = getGroupForTab(activeTab);
  if (correctGroup !== activeGroup) {
    setActiveGroup(correctGroup);
  }

  const activeGroupDef = TAB_GROUPS.find((g) => g.key === activeGroup)!;

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {isMobile ? (
          /* Mobile: grouped Select dropdown */
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {ALL_TABS.find((t) => t.value === activeTab)?.label || "选择功能"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TAB_GROUPS.map((group) => (
                <div key={group.key}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </div>
                  {group.tabs.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        ) : (
          /* Desktop: Two-level navigation */
          <div className="space-y-3">
            {/* Level 1: Group buttons */}
            <div className="flex flex-wrap gap-1.5">
              {TAB_GROUPS.map((group) => (
                <Button
                  key={group.key}
                  variant={activeGroup === group.key ? "default" : "outline"}
                  size="sm"
                  className="text-sm"
                  onClick={() => {
                    setActiveGroup(group.key);
                    setActiveTab(group.tabs[0].value);
                  }}
                >
                  {group.label}
                </Button>
              ))}
            </div>
            {/* Level 2: Sub-tabs */}
            <TabsList className="inline-flex w-auto h-auto p-1 gap-0.5">
              {activeGroupDef.tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-sm px-4 py-2">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}

        <TabsContent value="coaches">
          <PartnerCoachManager partnerId={partner.id} partnerCode={partner.partner_code} />
        </TabsContent>
        <TabsContent value="assessments">
          <PartnerAssessmentManager partnerId={partner.id} partnerCode={partner.partner_code} />
        </TabsContent>
        <TabsContent value="assessment-analytics">
          <PartnerAssessmentAnalytics partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="marketing">
          <PartnerMarketingHub partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="promotions">
          <PartnerPromotionManager partnerId={partner.id} partnerCode={partner.partner_code} />
        </TabsContent>
        <TabsContent value="channels">
          <PartnerChannelAttribution partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="reminders">
          <PartnerFollowupReminders partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="training">
          <PartnerTrainingCenter partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="team-members">
          <PartnerTeamManager partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="data-dashboard">
          <PartnerSharedDataDashboard partnerId={partner.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
