import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ArrowLeft, Loader2, TrendingUp, Share2, UserPlus, Bot, ClipboardList, Settings, Users, Store, ShoppingCart, Zap, Package, Sparkles, Megaphone, BarChart3, Bell, BookOpen } from "lucide-react";
import { IndustryPartner } from "./types";
import { BindUserDialog } from "./BindUserDialog";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy-loaded tab components
const PartnerInfoEditor = lazy(() => import("./PartnerInfoEditor").then((m) => ({ default: m.PartnerInfoEditor })));
const PartnerStats = lazy(() => import("@/components/partner/PartnerStats").then((m) => ({ default: m.PartnerStats })));
const PromotionHub = lazy(() => import("@/components/partner/PromotionHub").then((m) => ({ default: m.PromotionHub })));
const ReferralList = lazy(() => import("@/components/partner/ReferralList").then((m) => ({ default: m.ReferralList })));
const FlywheelGrowthSystem = lazy(() => import("@/components/partner/FlywheelGrowthSystem").then((m) => ({ default: m.FlywheelGrowthSystem })));
const PartnerCoachManager = lazy(() => import("@/components/partner/PartnerCoachManager").then((m) => ({ default: m.PartnerCoachManager })));
const PartnerAssessmentManager = lazy(() => import("@/components/partner/PartnerAssessmentManager").then((m) => ({ default: m.PartnerAssessmentManager })));
const PartnerProductBundles = lazy(() => import("./PartnerProductBundles").then((m) => ({ default: m.PartnerProductBundles })));
const PartnerTeamManager = lazy(() => import("./PartnerTeamManager").then((m) => ({ default: m.PartnerTeamManager })));
const PartnerStoreProducts = lazy(() => import("@/components/partner/PartnerStoreProducts").then((m) => ({ default: m.PartnerStoreProducts })));
const PartnerStoreOrders = lazy(() => import("@/components/partner/PartnerStoreOrders").then((m) => ({ default: m.PartnerStoreOrders })));
const PartnerMarketingHub = lazy(() => import("@/components/partner/PartnerMarketingHub").then((m) => ({ default: m.PartnerMarketingHub })));
const PartnerPromotionManager = lazy(() => import("@/components/partner/PartnerPromotionManager").then((m) => ({ default: m.PartnerPromotionManager })));
const PartnerChannelAttribution = lazy(() => import("@/components/partner/PartnerChannelAttribution").then((m) => ({ default: m.PartnerChannelAttribution })));
const PartnerFollowupReminders = lazy(() => import("@/components/partner/PartnerFollowupReminders").then((m) => ({ default: m.PartnerFollowupReminders })));
const PartnerTrainingCenter = lazy(() => import("@/components/partner/PartnerTrainingCenter").then((m) => ({ default: m.PartnerTrainingCenter })));

const TabLoading = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

interface TabDef {
  value: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "settings" | "business" | "content" | "marketing" | "crm" | "organization";
  adminOnly?: boolean;
}

const TAB_DEFINITIONS: TabDef[] = [
  // Settings group
  { value: "info", label: "基本信息", shortLabel: "信息", icon: Settings, group: "settings", adminOnly: true },
  // Business group
  { value: "revenue", label: "收益看板", shortLabel: "收益", icon: TrendingUp, group: "business" },
  { value: "promotion", label: "推广链接", shortLabel: "推广", icon: Share2, group: "business" },
  // Content group (建内容)
  { value: "coaches", label: "AI 教练", shortLabel: "教练", icon: Bot, group: "content" },
  { value: "assessments", label: "测评", shortLabel: "测评", icon: ClipboardList, group: "content" },
  { value: "bundles", label: "组合产品", shortLabel: "组合", icon: Package, group: "content" },
  // Marketing group (做推广)
  { value: "flywheel", label: "创建活动", shortLabel: "活动", icon: Zap, group: "marketing" },
  { value: "marketing", label: "AI文案", shortLabel: "文案", icon: Sparkles, group: "marketing" },
  
  { value: "channels", label: "渠道归因", shortLabel: "渠道", icon: BarChart3, group: "marketing" },
  // CRM group (跟客户)
  { value: "students", label: "学员管理", shortLabel: "学员", icon: UserPlus, group: "crm" },
  { value: "reminders", label: "跟进提醒", shortLabel: "提醒", icon: Bell, group: "crm" },
  { value: "training", label: "培训中心", shortLabel: "培训", icon: BookOpen, group: "crm" },
  // Organization group
  { value: "team", label: "团队成员", shortLabel: "团队", icon: Users, group: "organization" },
  { value: "store", label: "商城商品", shortLabel: "商品", icon: Store, group: "organization" },
  { value: "orders", label: "商城订单", shortLabel: "订单", icon: ShoppingCart, group: "organization" },
];

const GROUP_LABELS: Record<string, string> = {
  settings: "设置",
  business: "业务数据",
  content: "内容建设",
  marketing: "营销获客",
  crm: "客户运营",
  organization: "组织商城",
};

interface IndustryPartnerDetailProps {
  partner: IndustryPartner;
  isPartnerAdmin: boolean;
  onBack: () => void;
  onBindUser: (data: { partnerId: string; phone: string }) => Promise<void>;
  isBinding: boolean;
  onSaved: () => void;
}

export function IndustryPartnerDetail({ partner, isPartnerAdmin, onBack, onBindUser, isBinding, onSaved }: IndustryPartnerDetailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const visibleTabs = TAB_DEFINITIONS.filter((t) => !(t.adminOnly && isPartnerAdmin));

  const currentTab = searchParams.get("tab") || "flywheel";
  const setTab = (tab: string) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

  // Group tabs for desktop rendering
  const groupOrder = isPartnerAdmin
    ? ["business", "content", "marketing", "crm", "organization"]
    : ["settings", "business", "content", "marketing", "crm", "organization"];

  // Two-level nav: track active group
  const currentGroup = visibleTabs.find((t) => t.value === currentTab)?.group || groupOrder[0];
  const [activeGroup, setActiveGroup] = useState(currentGroup);
  const activeGroupTabs = visibleTabs.filter((t) => t.group === activeGroup);

  // Sync active group when tab changes externally (e.g. URL)
  const correctGroup = visibleTabs.find((t) => t.value === currentTab)?.group;
  if (correctGroup && correctGroup !== activeGroup) {
    setActiveGroup(correctGroup);
  }

  return (
    <AdminPageLayout
      title={partner.company_name || partner.partner_code}
      actions={
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回列表
        </Button>
      }
    >
      <Tabs value={currentTab} onValueChange={setTab} className="space-y-4">
        {/* Mobile: Select dropdown */}
        {isMobile ? (
          <Select value={currentTab} onValueChange={setTab}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(() => {
                  const tab = visibleTabs.find((t) => t.value === currentTab);
                  if (!tab) return "选择功能";
                  const Icon = tab.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groupOrder.map((groupKey) => {
                const groupTabs = visibleTabs.filter((t) => t.group === groupKey);
                if (groupTabs.length === 0) return null;
                return (
                  <div key={groupKey}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {GROUP_LABELS[groupKey]}
                    </div>
                    {groupTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <SelectItem key={tab.value} value={tab.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {tab.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          /* Desktop: Two-level navigation */
          <div className="space-y-3">
            {/* Level 1: Group buttons */}
            <div className="flex flex-wrap gap-1.5">
              {groupOrder.map((groupKey) => {
                const groupTabs = visibleTabs.filter((t) => t.group === groupKey);
                if (groupTabs.length === 0) return null;
                const isActive = activeGroup === groupKey;
                return (
                  <Button
                    key={groupKey}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="text-sm"
                    onClick={() => {
                      setActiveGroup(groupKey);
                      // Auto-select first tab in group
                      const firstTab = groupTabs[0];
                      if (firstTab) setTab(firstTab.value);
                    }}
                  >
                    {GROUP_LABELS[groupKey]}
                  </Button>
                );
              })}
            </div>
            {/* Level 2: Sub-tabs for active group */}
            <TabsList className="inline-flex w-auto h-auto p-1 gap-0.5">
              {activeGroupTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-sm px-4 py-2">
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        )}

        <Suspense fallback={<TabLoading />}>
          {!isPartnerAdmin && (
            <TabsContent value="info">
              <PartnerInfoEditor
                partner={partner}
                onSaved={onSaved}
                onBindUser={(id) => {
                  setBindDialogOpen(true);
                }}
              />
            </TabsContent>
          )}
          <TabsContent value="revenue">
            <PartnerStats
              partner={{
                ...partner,
                total_earnings: partner.total_earnings ?? 0,
                pending_balance: partner.pending_balance ?? 0,
                available_balance: partner.available_balance ?? 0,
                withdrawn_amount: partner.withdrawn_amount ?? 0,
                total_referrals: partner.total_referrals ?? 0,
                total_l2_referrals: partner.total_l2_referrals ?? 0,
                commission_rate_l1: partner.commission_rate_l1 ?? 0,
                commission_rate_l2: partner.commission_rate_l2 ?? 0,
                partner_level: partner.partner_level ?? "L1",
                prepurchase_count: partner.prepurchase_count ?? 0,
                partner_type: partner.partner_type ?? "industry",
                partner_code: partner.partner_code,
                source: "admin",
                partner_expires_at: partner.partner_expires_at ?? null,
                prepurchase_expires_at: null,
              } as any}
            />
          </TabsContent>
          <TabsContent value="promotion">
            <PromotionHub
              partnerId={partner.id}
              currentEntryType={partner.default_entry_type || "free"}
              prepurchaseCount={partner.prepurchase_count ?? 0}
              currentSelectedPackages={partner.selected_experience_packages}
            />
          </TabsContent>
          <TabsContent value="students">
            <ReferralList partnerId={partner.id} />
          </TabsContent>
          <TabsContent value="flywheel">
            <FlywheelGrowthSystem partnerId={partner.id} fromAdmin />
          </TabsContent>
          <TabsContent value="coaches">
            <PartnerCoachManager partnerId={partner.id} partnerCode={partner.partner_code} />
          </TabsContent>
          <TabsContent value="assessments">
            <PartnerAssessmentManager partnerId={partner.id} partnerCode={partner.partner_code} />
          </TabsContent>
          <TabsContent value="bundles">
            <PartnerProductBundles partnerId={partner.id} />
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
          <TabsContent value="team">
            <PartnerTeamManager partnerId={partner.id} />
          </TabsContent>
          <TabsContent value="store">
            <PartnerStoreProducts partnerId={partner.id} />
          </TabsContent>
          <TabsContent value="orders">
            <PartnerStoreOrders partnerId={partner.id} />
          </TabsContent>
        </Suspense>
      </Tabs>

      <BindUserDialog
        open={bindDialogOpen}
        onOpenChange={setBindDialogOpen}
        onBind={async (phone) => {
          await onBindUser({ partnerId: partner.id, phone });
        }}
        isBinding={isBinding}
      />
    </AdminPageLayout>
  );
}
