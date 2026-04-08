import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, ExternalLink, Trash2, Clock, Send, Loader2 } from "lucide-react";
import { AdminTableContainer } from "@/components/admin/shared/AdminTableContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContentTask {
  id: string;
  status: string;
  topic: string;
  ai_title: string | null;
  published_note_id: string | null;
  published_at: string | null;
  schedule_at: string | null;
  image_urls: string[] | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "outline" },
  generating: { label: "生成中", variant: "secondary" },
  ready: { label: "待发布", variant: "default" },
  scheduled: { label: "定时发布", variant: "secondary" },
  publishing: { label: "发布中", variant: "secondary" },
  published: { label: "已发布", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

export function XhsPublishManager() {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("xhs_content_tasks" as any)
      .select("id, status, topic, ai_title, published_note_id, published_at, schedule_at, image_urls, created_at")
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) toast.error("加载任务列表失败");
    else setTasks((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, [filter]);

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("xhs_content_tasks" as any).delete().eq("id", id);
    if (error) toast.error("删除失败");
    else { toast.success("已删除"); loadTasks(); }
  };

  const publishNow = async (task: ContentTask) => {
    setPublishingId(task.id);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: {
          action: "publish",
          task_id: task.id,
          title: task.ai_title || "",
          content: "",
          tags: [],
          image_urls: task.image_urls || [],
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("发布成功！");
      loadTasks();
    } catch (err: any) {
      toast.error(err.message || "发布失败");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="ready">待发布</SelectItem>
            <SelectItem value="scheduled">定时发布</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadTasks}><RefreshCw className="h-4 w-4" />刷新</Button>
      </div>

      <AdminTableContainer minWidth={700}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>主题</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>定时/发布时间</TableHead>
              <TableHead>封面</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无任务，去 AI 生成 Tab 创建内容吧</TableCell></TableRow>
            ) : (
              tasks.map((task) => {
                const status = statusMap[task.status] || { label: task.status, variant: "outline" as const };
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium max-w-[120px] truncate">{task.topic}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{task.ai_title || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.status === 'scheduled' && task.schedule_at ? (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(task.schedule_at).toLocaleString("zh-CN")}</span>
                      ) : task.published_at ? (
                        new Date(task.published_at).toLocaleString("zh-CN")
                      ) : (
                        new Date(task.created_at).toLocaleString("zh-CN")
                      )}
                    </TableCell>
                    <TableCell>
                      {task.image_urls && task.image_urls[0] ? (
                        <img src={task.image_urls[0]} alt="封面" className="w-10 h-10 rounded object-cover" />
                      ) : <span className="text-muted-foreground text-xs">无</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(task.status === 'ready' || task.status === 'scheduled' || task.status === 'failed') && (
                          <Button variant="ghost" size="sm" onClick={() => publishNow(task)} disabled={publishingId === task.id}>
                            {publishingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-primary" />}
                          </Button>
                        )}
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
