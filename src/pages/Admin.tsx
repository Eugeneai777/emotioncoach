import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAccountsTable } from "@/components/admin/UserAccountsTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { UsageRecordsTable } from "@/components/admin/UsageRecordsTable";
import { SyncStatusDashboard } from "@/components/admin/SyncStatusDashboard";
import ReportsManagement from "@/components/admin/ReportsManagement";

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
        <h1 className="text-3xl font-bold mb-6">管理后台</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">用户账户</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="usage">使用记录</TabsTrigger>
            <TabsTrigger value="sync">同步状态</TabsTrigger>
            <TabsTrigger value="reports">举报管理</TabsTrigger>
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

          <TabsContent value="sync">
            <SyncStatusDashboard />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
