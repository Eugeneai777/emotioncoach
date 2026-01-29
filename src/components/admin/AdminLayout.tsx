import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Routes, Route } from "react-router-dom";
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
import { PartnerLevelManagement } from "./PartnerLevelManagement";
import { HumanCoachesManagement } from "./human-coaches/HumanCoachesManagement";
import AdminBloomPartnerDelivery from "./AdminBloomPartnerDelivery";
import AdminBloomPartnerProfit from "./AdminBloomPartnerProfit";
import AdminBloomMonthlyProfit from "./AdminBloomMonthlyProfit";
import AdminBloomSingleDelivery from "./AdminBloomSingleDelivery";
import AdminBloomMonthlyCashflow from "./AdminBloomMonthlyCashflow";
import { ConversionFunnelDashboard } from "@/components/analytics/ConversionFunnelDashboard";
import OGPreviewManagement from "./OGPreviewManagement";
import ShareCardsAdmin from "@/pages/admin/ShareCardsAdmin";
import { BloomPartnerInvitations } from "./BloomPartnerInvitations";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-h-0">
          <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6 shrink-0">
            <SidebarTrigger className="-ml-2" />
          </header>
          <main 
            className="flex-1 overflow-y-auto overscroll-contain p-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserAccountsTable />} />
              <Route path="orders" element={<OrdersTable />} />
              <Route path="partners" element={<PartnerManagement />} />
              <Route path="bloom-invitations" element={<BloomPartnerInvitations />} />
              <Route path="bloom-delivery" element={<AdminBloomPartnerDelivery />} />
              <Route path="bloom-single" element={<AdminBloomSingleDelivery />} />
              <Route path="bloom-profit" element={<AdminBloomPartnerProfit />} />
              <Route path="bloom-monthly" element={<AdminBloomMonthlyProfit />} />
              <Route path="bloom-cashflow" element={<AdminBloomMonthlyCashflow />} />
              <Route path="coaches" element={<CoachTemplatesManagement />} />
              <Route path="camps" element={<CampTemplatesManagement />} />
              <Route path="human-coaches" element={<HumanCoachesManagement />} />
              <Route path="videos" element={<VideoCoursesManagement />} />
              <Route path="knowledge" element={<KnowledgeBaseManagement />} />
              <Route path="tools" element={<EnergyStudioToolsManagement />} />
              <Route path="usage" element={<UsageRecordsTable />} />
              <Route path="funnel" element={<ConversionFunnelDashboard />} />
              <Route path="cost-monitor" element={<CostMonitorDashboard />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route path="packages" element={<PackagesManagement />} />
              <Route path="partner-levels" element={<PartnerLevelManagement />} />
              <Route path="sync" element={<SyncStatusDashboard />} />
              <Route path="service" element={<CustomerServiceManagement />} />
              <Route path="og-preview" element={<OGPreviewManagement />} />
              <Route path="share-cards" element={<ShareCardsAdmin />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
