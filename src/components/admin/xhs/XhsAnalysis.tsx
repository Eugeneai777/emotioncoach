import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin/shared/AdminPageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XhsSearchPanel } from "./XhsSearchPanel";
import { XhsSavedNotes } from "./XhsSavedNotes";
import { XhsServerStatus } from "./XhsServerStatus";
import { XhsContentCreator } from "./XhsContentCreator";
import { XhsPublishManager } from "./XhsPublishManager";
import { XhsAutoComment } from "./XhsAutoComment";
import { XhsPerformanceTracker } from "./XhsPerformanceTracker";
import { useXhsSearch } from "@/hooks/useXhsSearch";
import type { XhsNote } from "@/hooks/useXhsSearch";

export default function XhsAnalysis() {
  const { serverStatus, checkStatus } = useXhsSearch();
  const [activeTab, setActiveTab] = useState("search");
  const [batchNotes, setBatchNotes] = useState<XhsNote[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const handleAddToCommentQueue = (notes: XhsNote[]) => {
    setBatchNotes(notes);
    setActiveTab("comment");
  };

  const handleBatchProcessed = () => {
    setBatchNotes([]);
  };

  return (
    <AdminPageLayout
      title="📕 小红书内容营销自动化"
      description="AI 生成爆款内容 → 自动发布 → 智能评论 → 数据追踪"
    >
      <XhsServerStatus status={serverStatus} onRefresh={checkStatus} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="search">搜索笔记</TabsTrigger>
          <TabsTrigger value="create">AI 生成</TabsTrigger>
          <TabsTrigger value="publish">发布管理</TabsTrigger>
          <TabsTrigger value="comment">自动评论</TabsTrigger>
          <TabsTrigger value="track">数据追踪</TabsTrigger>
          <TabsTrigger value="saved">我的收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <XhsSearchPanel onAddToCommentQueue={handleAddToCommentQueue} />
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <XhsContentCreator />
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <XhsPublishManager />
        </TabsContent>

        <TabsContent value="comment" className="mt-4">
          <XhsAutoComment batchNotes={batchNotes} onBatchProcessed={handleBatchProcessed} />
        </TabsContent>

        <TabsContent value="track" className="mt-4">
          <XhsPerformanceTracker />
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <XhsSavedNotes />
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
