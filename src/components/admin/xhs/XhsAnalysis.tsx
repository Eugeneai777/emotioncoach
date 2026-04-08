import { useState, useEffect } from "react";
import { AdminPageLayout } from "@/components/admin/shared/AdminPageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XhsSearchPanel } from "./XhsSearchPanel";
import { XhsSavedNotes } from "./XhsSavedNotes";
import { XhsServerStatus } from "./XhsServerStatus";
import { useXhsSearch } from "@/hooks/useXhsSearch";

export default function XhsAnalysis() {
  const { serverStatus, checkStatus } = useXhsSearch();

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <AdminPageLayout
      title="📕 小红书数据分析"
      description="搜索爆款笔记、分析内容规律、生成优质文案"
    >
      <XhsServerStatus status={serverStatus} onRefresh={checkStatus} />

      <Tabs defaultValue="search" className="mt-4">
        <TabsList>
          <TabsTrigger value="search">搜索笔记</TabsTrigger>
          <TabsTrigger value="saved">我的收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <XhsSearchPanel />
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <XhsSavedNotes />
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
