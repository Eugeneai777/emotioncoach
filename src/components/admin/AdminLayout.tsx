import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { UserAccountsTable } from "./UserAccountsTable";
import { OrdersTable } from "./OrdersTable";
import { UsageRecordsTable } from "./UsageRecordsTable";
import { SyncStatusDashboard } from "./SyncStatusDashboard";
import ReportsManagement from "./ReportsManagement";
import { VideoCoursesManagement } from "./VideoCoursesManagement";
import { EnergyStudioToolsManagement } from "./EnergyStudioToolsManagement";
import { PartnerManagement } from "./PartnerManagement";
import { PackagesManagement } from "./PackagesManagement";
import { CoachTemplatesManagement } from "./CoachTemplatesManagement";
import { CampTemplatesManagement } from "./CampTemplatesManagement";
import KnowledgeBaseManagement from "./KnowledgeBaseManagement";
import CustomerServiceManagement from "./CustomerServiceManagement";
import CostMonitorDashboard from "./CostMonitorDashboard";
import OperationsMonitorDashboard from "./OperationsMonitorDashboard";
import UserAnomalyMonitor from "./UserAnomalyMonitor";
import StabilityMonitor from "./StabilityMonitor";
import RiskContentMonitor from "./RiskContentMonitor";
import EmergencyContactsManagement from "./EmergencyContactsManagement";
import { PartnerLevelManagement } from "./PartnerLevelManagement";
import IndustryPartnerManagement from "./IndustryPartnerManagement";
import { HumanCoachesManagement } from "./human-coaches/HumanCoachesManagement";
import AdminBloomPartnerDelivery from "./AdminBloomPartnerDelivery";
import AdminBloomPartnerProfit from "./AdminBloomPartnerProfit";
import AdminBloomMonthlyProfit from "./AdminBloomMonthlyProfit";
import AdminBloomSingleDelivery from "./AdminBloomSingleDelivery";
import AdminBloomMonthlyCashflow from "./AdminBloomMonthlyCashflow";
import { ConversionFunnelDashboard } from "@/components/analytics/ConversionFunnelDashboard";
import PartnerAdminDashboard from "./PartnerAdminDashboard";
import OGPreviewManagement from "./OGPreviewManagement";
import ShareCardsAdmin from "@/pages/admin/ShareCardsAdmin";
import { BloomPartnerInvitations } from "./BloomPartnerInvitations";
import { ActivationCodeManagement } from "./ActivationCodeManagement";
import { ExperiencePackageManagement } from "./ExperiencePackageManagement";
import CommunityPostsManagement from "./CommunityPostsManagement";
import ContentAdminDashboard from "./ContentAdminDashboard";
import FlywheelDashboard from "./flywheel/FlywheelDashboard";
import FlywheelCampaigns from "./flywheel/FlywheelCampaigns";
import FlywheelFunnel from "./flywheel/FlywheelFunnel";
import FlywheelRevenue from "./flywheel/FlywheelRevenue";
import FlywheelReferral from "./flywheel/FlywheelReferral";
import FlywheelAIStrategy from "./flywheel/FlywheelAIStrategy";
export type AdminRole = 'admin' | 'content_admin' | 'partner_admin';

interface AdminLayoutProps {
  userRole: AdminRole;
}

export function AdminLayout({ userRole }: AdminLayoutProps) {
  const location = useLocation();
  const isContentAdmin = userRole === 'content_admin';
  const isPartnerAdmin = userRole === 'partner_admin';

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex w-full">
        <AdminSidebar userRole={userRole} />
        <SidebarInset className="flex-1 flex flex-col min-h-0">
          <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6 shrink-0">
            <SidebarTrigger className="-ml-2" />
          </header>
          <main 
            className="flex-1 overflow-auto overscroll-contain p-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Routes>
              {/* partner_admin 专属路由 */}
              {isPartnerAdmin && (
                <>
                  <Route index element={<PartnerAdminDashboard />} />
                  <Route path="industry-partners" element={<IndustryPartnerManagement />} />
                  <Route path="*" element={<Navigate to="/admin/industry-partners" replace />} />
                </>
              )}
              {/* admin 全权限路由 */}
              {!isContentAdmin && !isPartnerAdmin && (
                <>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserAccountsTable />} />
                  <Route path="orders" element={<OrdersTable />} />
                  <Route path="partners" element={<PartnerManagement />} />
                  <Route path="industry-partners" element={<IndustryPartnerManagement />} />
                  <Route path="bloom-invitations" element={<BloomPartnerInvitations />} />
                  <Route path="bloom-delivery" element={<AdminBloomPartnerDelivery />} />
                  <Route path="bloom-single" element={<AdminBloomSingleDelivery />} />
                  <Route path="bloom-profit" element={<AdminBloomPartnerProfit />} />
                  <Route path="bloom-monthly" element={<AdminBloomMonthlyProfit />} />
                  <Route path="bloom-cashflow" element={<AdminBloomMonthlyCashflow />} />
                  <Route path="usage" element={<UsageRecordsTable />} />
                  <Route path="activation-codes" element={<ActivationCodeManagement />} />
                  <Route path="funnel" element={<ConversionFunnelDashboard />} />
                  <Route path="cost-monitor" element={<CostMonitorDashboard />} />
                  <Route path="api-monitor" element={<OperationsMonitorDashboard />} />
                  <Route path="user-anomaly" element={<UserAnomalyMonitor />} />
                  <Route path="stability" element={<StabilityMonitor />} />
                  <Route path="risk-content" element={<RiskContentMonitor />} />
                  <Route path="emergency-contacts" element={<EmergencyContactsManagement />} />
                  <Route path="packages" element={<PackagesManagement />} />
                  <Route path="partner-levels" element={<PartnerLevelManagement />} />
                  <Route path="sync" element={<SyncStatusDashboard />} />
                  <Route path="service" element={<CustomerServiceManagement />} />
                  <Route path="og-preview" element={<OGPreviewManagement />} />
                  <Route path="share-cards" element={<ShareCardsAdmin />} />
                  <Route path="experience-items" element={<ExperiencePackageManagement />} />
                  <Route path="flywheel" element={<FlywheelDashboard />} />
                  <Route path="flywheel-campaigns" element={<FlywheelCampaigns />} />
                  <Route path="flywheel-funnel" element={<FlywheelFunnel />} />
                  <Route path="flywheel-revenue" element={<FlywheelRevenue />} />
                  <Route path="flywheel-referral" element={<FlywheelReferral />} />
                  <Route path="flywheel-ai" element={<FlywheelAIStrategy />} />
                </>
              )}
              {/* content_admin 专属首页 */}
              {isContentAdmin && (
                <Route index element={<ContentAdminDashboard />} />
              )}
              {/* 内容管理 - admin 和 content_admin 均可访问 */}
              {!isPartnerAdmin && (
                <>
                  <Route path="coaches" element={<CoachTemplatesManagement />} />
                  <Route path="camps" element={<CampTemplatesManagement />} />
                  <Route path="human-coaches" element={<HumanCoachesManagement />} />
                  <Route path="videos" element={<VideoCoursesManagement />} />
                  <Route path="knowledge" element={<KnowledgeBaseManagement />} />
                  <Route path="tools" element={<EnergyStudioToolsManagement />} />
                  <Route path="community-posts" element={<CommunityPostsManagement />} />
                  <Route path="reports" element={<ReportsManagement />} />
                </>
              )}
              {/* 未匹配路由重定向 */}
              {isContentAdmin && (
                <Route path="*" element={<Navigate to="/admin/community-posts" replace />} />
              )}
              {!isContentAdmin && !isPartnerAdmin && (
                <Route path="*" element={<Navigate to="/admin" replace />} />
              )}
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
