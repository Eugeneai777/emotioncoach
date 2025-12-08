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
import KnowledgeBaseManagement from "./KnowledgeBaseManagement";
import CustomerServiceManagement from "./CustomerServiceManagement";
import FeatureCostManagement from "./FeatureCostManagement";
import CostMonitorDashboard from "./CostMonitorDashboard";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger className="-ml-2" />
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserAccountsTable />} />
              <Route path="orders" element={<OrdersTable />} />
              <Route path="partners" element={<PartnerManagement />} />
              <Route path="coaches" element={<CoachTemplatesManagement />} />
              <Route path="videos" element={<VideoCoursesManagement />} />
              <Route path="knowledge" element={<KnowledgeBaseManagement />} />
              <Route path="tools" element={<EnergyStudioToolsManagement />} />
              <Route path="usage" element={<UsageRecordsTable />} />
              <Route path="pricing" element={<FeatureCostManagement />} />
              <Route path="cost-monitor" element={<CostMonitorDashboard />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route path="packages" element={<PackagesManagement />} />
              <Route path="sync" element={<SyncStatusDashboard />} />
              <Route path="service" element={<CustomerServiceManagement />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
