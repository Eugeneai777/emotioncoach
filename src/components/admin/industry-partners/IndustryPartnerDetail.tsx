import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, TrendingUp, Share2, UserPlus, Bot, ClipboardList, Settings, Users } from "lucide-react";
import { IndustryPartner } from "./types";
import { BindUserDialog } from "./BindUserDialog";

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

const TabLoading = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

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

  const currentTab = searchParams.get("tab") || "flywheel";
  const setTab = (tab: string) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

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
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            {!isPartnerAdmin && (
              <TabsTrigger value="info" className="gap-1 text-xs sm:text-sm">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">基本信息</span>
                <span className="sm:hidden">信息</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="revenue" className="gap-1 text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">收益看板</span>
              <span className="sm:hidden">收益</span>
            </TabsTrigger>
            <TabsTrigger value="promotion" className="gap-1 text-xs sm:text-sm">
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">推广链接</span>
              <span className="sm:hidden">推广</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1 text-xs sm:text-sm">
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">学员管理</span>
              <span className="sm:hidden">学员</span>
            </TabsTrigger>
            <TabsTrigger value="flywheel" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">创建活动</span>
              <span className="sm:hidden">活动</span>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="gap-1 text-xs sm:text-sm">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI 教练</span>
              <span className="sm:hidden">教练</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="gap-1 text-xs sm:text-sm">
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">测评</span>
              <span className="sm:hidden">测评</span>
            </TabsTrigger>
            <TabsTrigger value="bundles" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">组合产品</span>
              <span className="sm:hidden">组合</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-1 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">团队成员</span>
              <span className="sm:hidden">团队</span>
            </TabsTrigger>
            <TabsTrigger value="store" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">商城商品</span>
              <span className="sm:hidden">商品</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">商城订单</span>
              <span className="sm:hidden">订单</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
