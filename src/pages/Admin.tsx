import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { UserAccountsTable } from "@/components/admin/UserAccountsTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { UsageRecordsTable } from "@/components/admin/UsageRecordsTable";
import { SyncStatusDashboard } from "@/components/admin/SyncStatusDashboard";
import ReportsManagement from "@/components/admin/ReportsManagement";
import { VideoCoursesManagement } from "@/components/admin/VideoCoursesManagement";
import { EnergyStudioToolsManagement } from "@/components/admin/EnergyStudioToolsManagement";
import { PartnerManagement } from "@/components/admin/PartnerManagement";
import { PackagesManagement } from "@/components/admin/PackagesManagement";
import { CoachTemplatesManagement } from "@/components/admin/CoachTemplatesManagement";
import { CampTemplatesManagement } from "@/components/admin/CampTemplatesManagement";
import KnowledgeBaseManagement from "@/components/admin/KnowledgeBaseManagement";
import CustomerServiceManagement from "@/components/admin/CustomerServiceManagement";
import FeatureCostManagement from "@/components/admin/FeatureCostManagement";
import CostMonitorDashboard from "@/components/admin/CostMonitorDashboard";
import ConversionAnalytics from "@/components/admin/ConversionAnalytics";
import OGPreviewManagement from "@/components/admin/OGPreviewManagement";
import { BloomPartnerInvitations } from "@/components/admin/BloomPartnerInvitations";
import CommunityPostsManagement from "@/components/admin/CommunityPostsManagement";

function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<UserAccountsTable />} />
      <Route path="orders" element={<OrdersTable />} />
      <Route path="partners" element={<PartnerManagement />} />
      <Route path="bloom-invitations" element={<BloomPartnerInvitations />} />
      <Route path="coaches" element={<CoachTemplatesManagement />} />
      <Route path="camps" element={<CampTemplatesManagement />} />
      <Route path="videos" element={<VideoCoursesManagement />} />
      <Route path="knowledge" element={<KnowledgeBaseManagement />} />
      <Route path="tools" element={<EnergyStudioToolsManagement />} />
      <Route path="usage" element={<UsageRecordsTable />} />
      <Route path="pricing" element={<FeatureCostManagement />} />
      <Route path="cost-monitor" element={<CostMonitorDashboard />} />
      <Route path="conversion" element={<ConversionAnalytics />} />
      <Route path="reports" element={<ReportsManagement />} />
      <Route path="packages" element={<PackagesManagement />} />
      <Route path="sync" element={<SyncStatusDashboard />} />
      <Route path="service" element={<CustomerServiceManagement />} />
      <Route path="og-preview" element={<OGPreviewManagement />} />
      <Route path="community-posts" element={<CommunityPostsManagement />} />
    </Routes>
  );
}

import type { AdminRole } from "@/components/admin/AdminLayout";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'content_admin']);

      if (!roles || roles.length === 0) {
        navigate("/");
        return;
      }

      // admin 优先
      const hasAdmin = roles.some(r => r.role === 'admin');
      setUserRole(hasAdmin ? 'admin' : 'content_admin');
      setChecking(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  if (!userRole) {
    return null;
  }

  return <AdminLayout userRole={userRole} />;
}
