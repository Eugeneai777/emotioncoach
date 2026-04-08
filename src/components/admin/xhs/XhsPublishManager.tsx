import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { AdminTableContainer } from "@/components/admin/shared/AdminTableContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContentTask {
  id: string;
  status: string;
  topic: string;
  ai_title: string | null;
  published_note_id: string | null;
  published_at: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "outline" },
  generating: { label: "生成中", variant: "secondary" },
  ready: { label: "待发布", variant: "default" },
  publishing: { label: "发布中", variant: "secondary" },
  published: { label: "已发布", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

export function XhsPublishManager() {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("xhs_content_tasks" as any)
      .select("id, status, topic, ai_title, published_note_id, published_at, created_at")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("加载任务列表失败");
    } else {
      setTasks((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("xhs_content_tasks" as any).delete().eq("id", id);
    if (error) {
      toast.error("删除失败");
    } else {
      toast.success("已删除");
      loadTasks();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="ready">待发布</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={loadTasks}>
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      </div>

      <AdminTableContainer minWidth={600}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>主题</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无任务，去 AI 生成 Tab 创建内容吧
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const status = statusMap[task.status] || { label: task.status, variant: "outline" as const };
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.topic}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{task.ai_title || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(task.created_at).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {task.published_note_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://www.xiaohongshu.com/explore/${task.published_note_id}`} target="_blank" rel="noopener">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminTableContainer>
    </div>
  );
}
