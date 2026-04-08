import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MessageSquare, Send, Loader2, Sparkles, History, Pause, Play,
  Trash2, AlertTriangle, Settings2, Zap
} from "lucide-react";
import { AdminTableContainer } from "@/components/admin/shared/AdminTableContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { XhsNote } from "@/hooks/useXhsSearch";

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

interface QueueItem {
  noteId: string;
  noteTitle: string;
  commentText: string;
  status: "pending" | "generating" | "sending" | "sent" | "failed";
  error?: string;
}

// 引流评论模板
const COMMENT_TEMPLATES = [
  "说得太对了！我最近也在学情绪管理，感觉整个人都不一样了 ✨",
  "这篇写到心坎里了，收藏！想问下姐妹是怎么开始改变的？",
  "天呐，和我的经历一模一样！后来我找到了一个很好的方法 💪",
  "这个分享太有价值了，已经在实践了，果然有效果！",
  "求展开讲讲！我身边很多人也有这个困扰 🥺",
  "关注了！你的内容真的很治愈，每次看完都能量满满 🌟",
];

interface XhsAutoCommentProps {
  /** Notes added from search panel for batch commenting */
  batchNotes?: XhsNote[];
  onBatchProcessed?: () => void;
}

export function XhsAutoComment({ batchNotes, onBatchProcessed }: XhsAutoCommentProps) {
  // Single comment
  const [noteId, setNoteId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Batch queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [commentInterval, setCommentInterval] = useState(8); // seconds
  const [dailyLimit, setDailyLimit] = useState(50);
  const [todayCount, setTodayCount] = useState(0);
  const [commentStyle, setCommentStyle] = useState("empathy"); // empathy, question, praise

  // History
  const [history, setHistory] = useState<CommentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const queueRef = useRef(queue);
  queueRef.current = queue;
  const runningRef = useRef(isQueueRunning);
  runningRef.current = isQueueRunning;

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("xhs_auto_comments" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory((data as any) ?? []);

    // Count today's comments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("xhs_auto_comments" as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", today.toISOString());
    setTodayCount(count ?? 0);

    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Handle batch notes from search panel
  useEffect(() => {
    if (batchNotes && batchNotes.length > 0) {
      const newItems: QueueItem[] = batchNotes.map((note) => ({
        noteId: note.note_id,
        noteTitle: note.title || "未知标题",
        commentText: "", // Will be AI-generated
        status: "pending" as const,
      }));
      setQueue((prev) => [...prev, ...newItems]);
      toast.success(`已添加 ${batchNotes.length} 条笔记到评论队列`);
      onBatchProcessed?.();
    }
  }, [batchNotes]);

  const generateCommentForNote = async (noteTitle: string, style: string): Promise<string> => {
    const stylePrompts: Record<string, string> = {
      empathy: "共情风格：表达相同经历和感受，让对方感觉被理解",
      question: "提问风格：好奇地追问细节，引发回复和互动",
      praise: "赞美风格：真诚夸赞内容价值，表达学到了东西",
    };

    try {
      const { data, error } = await supabase.functions.invoke("xhs-content-generator", {
        body: {
          topic: `为小红书笔记"${noteTitle}"写一条引流评论。要求：${stylePrompts[style] || stylePrompts.empathy}。不超过50字，像真实用户的自然互动，不要@和链接，可以用1-2个emoji`,
          target_audience: "小红书活跃用户",
          style: "评论",
        },
      });
      if (error) throw error;
      if (data?.data?.title) {
        // Use title as short comment (it's usually concise)
        return data.data.title.replace(/[📕📗📘📙📓📔📒📝]/g, "").slice(0, 80);
      }
      if (data?.data?.content) {
        return data.data.content.split(/[。！？\n]/)[0].slice(0, 80);
      }
    } catch {
      // Fallback to template
    }
    return COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
  };

  const sendSingleComment = async () => {
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
      setTodayCount((c) => c + 1);
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "评论发送失败");
    } finally {
      setSending(false);
    }
  };

  const generateForSingle = async () => {
    if (!noteTitle.trim() && !noteId.trim()) {
      toast.error("请输入笔记标题");
      return;
    }
    setAiGenerating(true);
    const comment = await generateCommentForNote(noteTitle || noteId, commentStyle);
    setCommentText(comment);
    setAiGenerating(false);
    toast.success("AI 评论已生成");
  };

  // Batch queue runner
  const runQueue = useCallback(async () => {
    setIsQueueRunning(true);

    for (let i = 0; i < queueRef.current.length; i++) {
      if (!runningRef.current) break;

      const item = queueRef.current[i];
      if (item.status !== "pending") continue;

      // Check daily limit
      if (todayCount >= dailyLimit) {
        toast.warning(`今日评论已达上限 (${dailyLimit})，队列暂停`);
        break;
      }

      // Generate comment if empty
      let comment = item.commentText;
      if (!comment) {
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "generating" } : q));
        comment = await generateCommentForNote(item.noteTitle, commentStyle);
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, commentText: comment, status: "pending" } : q));
      }

      // Send
      setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "sending", commentText: comment } : q));

      try {
        const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
          body: {
            action: "comment",
            note_id: item.noteId,
            comment_text: comment,
            note_title: item.noteTitle,
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "sent" } : q));
        setTodayCount((c) => c + 1);
      } catch (err: any) {
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "failed", error: err.message } : q));
      }

      // Wait interval before next
      if (i < queueRef.current.length - 1 && runningRef.current) {
        await new Promise((r) => setTimeout(r, commentInterval * 1000));
      }
    }

    setIsQueueRunning(false);
    loadHistory();
  }, [commentInterval, commentStyle, dailyLimit, todayCount]);

  const stopQueue = () => {
    runningRef.current = false;
    setIsQueueRunning(false);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const removeFromQueue = (idx: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const queueStats = {
    total: queue.length,
    pending: queue.filter((q) => q.status === "pending").length,
    sent: queue.filter((q) => q.status === "sent").length,
    failed: queue.filter((q) => q.status === "failed").length,
  };

  const statusLabel: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { text: "待发送", variant: "outline" },
    generating: { text: "AI生成中", variant: "secondary" },
    sending: { text: "发送中", variant: "secondary" },
    sent: { text: "已发送", variant: "default" },
    failed: { text: "失败", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      {/* Settings & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-xs text-muted-foreground">今日已评论</div>
            <Progress value={(todayCount / dailyLimit) * 100} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">上限 {dailyLimit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{queueStats.pending}</div>
            <div className="text-xs text-muted-foreground">队列待处理</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{queueStats.sent}</div>
            <div className="text-xs text-muted-foreground">已成功</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-destructive">{queueStats.failed}</div>
            <div className="text-xs text-muted-foreground">失败</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Queue */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                批量评论队列
              </div>
              <div className="flex gap-2">
                {isQueueRunning ? (
                  <Button variant="outline" size="sm" onClick={stopQueue}>
                    <Pause className="h-4 w-4" />
                    暂停
                  </Button>
                ) : (
                  <Button size="sm" onClick={runQueue} disabled={queueStats.pending === 0}>
                    <Play className="h-4 w-4" />
                    开始执行
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearQueue} disabled={isQueueRunning}>
                  <Trash2 className="h-4 w-4" />
                  清空
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Queue Settings */}
            <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">间隔(秒)</Label>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={commentInterval}
                  onChange={(e) => setCommentInterval(Math.max(5, Number(e.target.value)))}
                  className="w-20 h-8"
                  disabled={isQueueRunning}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">每日上限</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-20 h-8"
                  disabled={isQueueRunning}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">评论风格</Label>
                <Select value={commentStyle} onValueChange={setCommentStyle} disabled={isQueueRunning}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empathy">共情型</SelectItem>
                    <SelectItem value="question">提问型</SelectItem>
                    <SelectItem value="praise">赞美型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Queue Items */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {queue.map((item, idx) => {
                const s = statusLabel[item.status] || statusLabel.pending;
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded border text-sm">
                    <Badge variant={s.variant} className="shrink-0">{s.text}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.noteTitle}</div>
                      {item.commentText && (
                        <div className="truncate text-muted-foreground text-xs">{item.commentText}</div>
                      )}
                      {item.error && (
                        <div className="text-xs text-destructive">{item.error}</div>
                      )}
                    </div>
                    {item.status === "pending" && !isQueueRunning && (
                      <Button variant="ghost" size="sm" onClick={() => removeFromQueue(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    {item.status === "sending" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>系统会自动控制评论频率（最少{commentInterval}秒/条），避免触发平台风控。建议每日不超过{dailyLimit}条。</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Comment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            单条评论
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
              <Label>笔记标题（用于 AI 生成）</Label>
              <Input
                placeholder="输入笔记标题帮助生成更精准的评论"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>评论内容 *</Label>
              <div className="flex items-center gap-2">
                <Select value={commentStyle} onValueChange={setCommentStyle}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empathy">共情型</SelectItem>
                    <SelectItem value="question">提问型</SelectItem>
                    <SelectItem value="praise">赞美型</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={generateForSingle} disabled={aiGenerating}>
                  {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI 生成
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="输入评论内容，或选择风格后点击 AI 生成"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
            {/* Quick templates */}
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMENT_TEMPLATES.slice(0, 3).map((tpl, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer text-xs hover:bg-primary/10"
                  onClick={() => setCommentText(tpl)}
                >
                  {tpl.slice(0, 20)}...
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={sendSingleComment} disabled={sending || !noteId.trim() || !commentText.trim()}>
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
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              评论历史
            </div>
            <Button variant="outline" size="sm" onClick={loadHistory}>刷新</Button>
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
