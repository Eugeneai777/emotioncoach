import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
import KnowledgeBaseManagement from "@/components/admin/KnowledgeBaseManagement";
import CustomerServiceManagement from "@/components/admin/CustomerServiceManagement";
import FeatureCostManagement from "@/components/admin/FeatureCostManagement";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
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
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">管理后台</h1>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="users">用户账户</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="usage">使用记录</TabsTrigger>
            <TabsTrigger value="costs">扣费规则</TabsTrigger>
            <TabsTrigger value="sync">同步状态</TabsTrigger>
            <TabsTrigger value="reports">举报管理</TabsTrigger>
            <TabsTrigger value="videos">视频课程</TabsTrigger>
            <TabsTrigger value="tools">生活馆工具</TabsTrigger>
            <TabsTrigger value="partners">合伙人管理</TabsTrigger>
            <TabsTrigger value="packages">套餐权益</TabsTrigger>
            <TabsTrigger value="coaches">教练模板</TabsTrigger>
            <TabsTrigger value="knowledge">知识库</TabsTrigger>
            <TabsTrigger value="service">客服管理</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserAccountsTable />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable />
          </TabsContent>

          <TabsContent value="usage">
            <UsageRecordsTable />
          </TabsContent>

          <TabsContent value="costs">
            <FeatureCostManagement />
          </TabsContent>

          <TabsContent value="sync">
            <SyncStatusDashboard />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement />
          </TabsContent>

          <TabsContent value="videos">
            <VideoCoursesManagement />
          </TabsContent>

          <TabsContent value="tools">
            <EnergyStudioToolsManagement />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerManagement />
          </TabsContent>

          <TabsContent value="packages">
            <PackagesManagement />
          </TabsContent>

          <TabsContent value="coaches">
            <CoachTemplatesManagement />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBaseManagement />
          </TabsContent>

          <TabsContent value="service">
            <CustomerServiceManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
