import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2, Sparkles, History } from "lucide-react";
import { AdminTableContainer } from "@/components/admin/shared/AdminTableContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CommentRecord {
  id: string;
  target_note_id: string;
  target_title: string | null;
  comment_text: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function XhsAutoComment() {
  const [noteId, setNoteId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [history, setHistory] = useState<CommentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("xhs_auto_comments" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory((data as any) ?? []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const generateComment = async () => {
    if (!noteTitle.trim() && !noteId.trim()) {
      toast.error("请输入笔记标题或ID");
      return;
    }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-content-generator", {
        body: {
          topic: `为小红书笔记"${noteTitle || noteId}"写一条自然、有共鸣感的评论，不超过50字，像真实用户的互动`,
          target_audience: "小红书用户",
          style: "评论风格：简短、真实、有互动感",
        },
      });
      if (error) throw new Error(error.message);
      if (data?.data?.content) {
        // Extract first sentence as comment
        const content = data.data.content;
        const shortComment = content.split(/[。！？\n]/)[0].slice(0, 80);
        setCommentText(shortComment);
        toast.success("AI 评论已生成");
      }
    } catch (err: any) {
      toast.error(err.message || "生成失败");
    } finally {
      setAiGenerating(false);
    }
  };

  const sendComment = async () => {
    if (!noteId.trim() || !commentText.trim()) {
      toast.error("请填写笔记ID和评论内容");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: {
          action: "comment",
          note_id: noteId.trim(),
          comment_text: commentText.trim(),
          note_title: noteTitle.trim() || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("评论发送成功！");
      setCommentText("");
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "评论发送失败");
    } finally {
      setSending(false);
    }
  };

  const statusLabel: Record<string, { text: string; variant: "default" | "secondary" | "destructive" }> = {
    pending: { text: "待发送", variant: "secondary" },
    sent: { text: "已发送", variant: "default" },
    failed: { text: "失败", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            发表评论
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>笔记 ID *</Label>
              <Input
                placeholder="输入目标笔记的 ID"
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
              />
            </div>
            <div>
              <Label>笔记标题（可选）</Label>
              <Input
                placeholder="用于 AI 生成更精准的评论"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>评论内容 *</Label>
              <Button variant="ghost" size="sm" onClick={generateComment} disabled={aiGenerating}>
                {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI 生成
              </Button>
            </div>
            <Textarea
              placeholder="输入评论内容，或点击 AI 生成"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button onClick={sendComment} disabled={sending || !noteId.trim() || !commentText.trim()}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                发送评论
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">⚠️ 为防止封号，系统会自动限制评论频率（≥5秒/条）</p>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            评论历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTableContainer minWidth={500}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>目标笔记</TableHead>
                  <TableHead>评论内容</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无评论记录</TableCell>
                  </TableRow>
                ) : (
                  history.map((r) => {
                    const s = statusLabel[r.status] || { text: r.status, variant: "secondary" as const };
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[150px] truncate">{r.target_title || r.target_note_id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.comment_text}</TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.text}</Badge>
                          {r.error_message && (
                            <p className="text-xs text-destructive mt-1">{r.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.created_at).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </AdminTableContainer>
        </CardContent>
      </Card>
    </div>
  );
}
