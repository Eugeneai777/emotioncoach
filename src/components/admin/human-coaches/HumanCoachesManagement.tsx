import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachApplicationsList } from "./CoachApplicationsList";
import { ApprovedCoachesList } from "./ApprovedCoachesList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Clock, XCircle, Users } from "lucide-react";

export function HumanCoachesManagement() {
  const [activeTab, setActiveTab] = useState("pending");

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ["human-coaches-stats"],
    queryFn: async () => {
      const [pending, approved, rejected, total] = await Promise.all([
        supabase.from("human_coaches").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("human_coaches").select("id", { count: "exact" }).eq("status", "approved"),
        supabase.from("human_coaches").select("id", { count: "exact" }).eq("status", "rejected"),
        supabase.from("human_coaches").select("id", { count: "exact" })
      ]);
      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
        total: total.count || 0
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">真人教练管理</h1>
        <p className="text-muted-foreground">管理教练申请、审核资质、编辑教练信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">待审核</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                <p className="text-xs text-muted-foreground">已通过</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
                <p className="text-xs text-muted-foreground">已拒绝</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">总计</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            待审核 {stats?.pending ? `(${stats.pending})` : ""}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="h-4 w-4" />
            已通过 {stats?.approved ? `(${stats.approved})` : ""}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            已拒绝 {stats?.rejected ? `(${stats.rejected})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <CoachApplicationsList status="pending" />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <ApprovedCoachesList />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <CoachApplicationsList status="rejected" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
