import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, RefreshCw, TrendingUp, Loader2 } from "lucide-react";
import { AdminTableContainer } from "@/components/admin/shared/AdminTableContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TrackingRecord {
  id: string;
  note_id: string;
  likes: number;
  collects: number;
  comments: number;
  tracked_at: string;
  content_task_id: string | null;
}

interface PublishedTask {
  id: string;
  topic: string;
  ai_title: string | null;
  published_note_id: string;
}

export function XhsPerformanceTracker() {
  const [publishedTasks, setPublishedTasks] = useState<PublishedTask[]>([]);
  const [tracking, setTracking] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    // Load published tasks
    const { data: tasks } = await supabase
      .from("xhs_content_tasks" as any)
      .select("id, topic, ai_title, published_note_id")
      .eq("status", "published")
      .not("published_note_id", "is", null)
      .order("published_at", { ascending: false });

    setPublishedTasks((tasks as any) ?? []);

    // Load tracking data
    const { data: trackData } = await supabase
      .from("xhs_performance_tracking" as any)
      .select("*")
      .order("tracked_at", { ascending: false })
      .limit(200);

    setTracking((trackData as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshTracking = async (noteId: string, taskId: string) => {
    setRefreshing(noteId);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: { action: "track", note_id: noteId, task_id: taskId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("数据已更新");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "追踪失败");
    } finally {
      setRefreshing(null);
    }
  };

  const getLatestTracking = (noteId: string) => {
    return tracking.find((t) => t.note_id === noteId);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{publishedTasks.length}</div>
            <div className="text-sm text-muted-foreground">已发布笔记</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tracking.reduce((sum, t) => sum + (t.likes || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">总点赞数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tracking.reduce((sum, t) => sum + (t.collects || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">总收藏数</div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              数据追踪
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : publishedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无已发布笔记，先去 AI 生成 Tab 创作并发布内容吧
            </div>
          ) : (
            <AdminTableContainer minWidth={600}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>主题</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>👍 点赞</TableHead>
                    <TableHead>⭐ 收藏</TableHead>
                    <TableHead>💬 评论</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publishedTasks.map((task) => {
                    const latest = getLatestTracking(task.published_note_id);
                    return (
                      <TableRow key={task.id}>
                        <TableCell>{task.topic}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{task.ai_title || "-"}</TableCell>
                        <TableCell>{latest?.likes ?? "-"}</TableCell>
                        <TableCell>{latest?.collects ?? "-"}</TableCell>
                        <TableCell>{latest?.comments ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {latest ? new Date(latest.tracked_at).toLocaleString("zh-CN") : "未追踪"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshTracking(task.published_note_id, task.id)}
                            disabled={refreshing === task.published_note_id}
                          >
                            {refreshing === task.published_note_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminTableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
