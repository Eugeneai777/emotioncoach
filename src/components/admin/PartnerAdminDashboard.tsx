import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Megaphone, Users } from "lucide-react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminStatCard } from "./shared/AdminStatCard";

export default function PartnerAdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['partner-admin-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return { partnerCount: 0, activeCampaigns: 0 };

      // 获取绑定的合伙人ID
      const { data: bindings } = await supabase
        .from('partner_admin_bindings' as any)
        .select('partner_id')
        .eq('admin_user_id', user.id);

      const partnerIds = (bindings as any[])?.map((b: any) => b.partner_id) || [];

      if (partnerIds.length === 0) {
        return { partnerCount: 0, activeCampaigns: 0 };
      }

      // 活跃活动数
      const { count: activeCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .in('partner_id', partnerIds)
        .eq('status', 'published');

      return {
        partnerCount: partnerIds.length,
        activeCampaigns: activeCampaigns || 0,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <AdminPageLayout title="运营概览" description="查看您管理的行业合伙人数据">
      <div className="grid gap-3 grid-cols-2">
        <AdminStatCard
          label="管理的合伙人"
          value={stats?.partnerCount || 0}
          icon={Building2}
          loading={isLoading}
          href="/admin/industry-partners"
        />
        <AdminStatCard
          label="活跃活动"
          value={stats?.activeCampaigns || 0}
          icon={Megaphone}
          accent="bg-blue-500/10 text-blue-600"
          loading={isLoading}
          href="/admin/industry-partners"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            快速操作
          </CardTitle>
          <CardDescription>常用管理入口</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
            <Link to="/admin/industry-partners">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">行业合伙人管理</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
