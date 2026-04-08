import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Clock, Loader2, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedContent {
  title: string;
  content: string;
  tags: string[];
  image_prompts: { description: string; style?: string }[];
}

export function XhsContentCreator() {
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [style, setStyle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Editable fields after generation
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("请输入内容主题");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-content-generator", {
        body: { topic: topic.trim(), target_audience: targetAudience.trim() || undefined, style: style.trim() || undefined },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const content = data.data as GeneratedContent;
      setGenerated(content);
      setTaskId(data.task_id);
      setEditTitle(content.title);
      setEditContent(content.content);
      setEditTags(content.tags.join(", "));
      toast.success("AI 内容生成成功！");
    } catch (err: any) {
      toast.error(err.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!taskId) return;
    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: {
          action: "publish",
          task_id: taskId,
          title: editTitle,
          content: editContent,
          tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("笔记发布成功！");
      setGenerated(null);
      setTaskId(null);
    } catch (err: any) {
      toast.error(err.message || "发布失败");
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 智能创作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>内容主题 *</Label>
            <Input
              placeholder="例如：情绪管理、职场焦虑、亲密关系..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>目标人群</Label>
              <Input
                placeholder="例如：25-35岁职场女性"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            <div>
              <Label>风格偏好</Label>
              <Input
                placeholder="例如：温暖走心、干货型、故事型"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating || !topic.trim()}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成内容
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview & Edit Section */}
      {generated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📝 内容预览与编辑</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                  <RefreshCw className="h-4 w-4" />
                  重新生成
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>标题</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editTitle)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>正文</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editContent)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <div>
              <Label>标签（逗号分隔）</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
              <div className="flex flex-wrap gap-1 mt-2">
                {editTags.split(",").map((tag, i) => tag.trim() && (
                  <Badge key={i} variant="secondary">#{tag.trim()}</Badge>
                ))}
              </div>
            </div>

            {generated.image_prompts && generated.image_prompts.length > 0 && (
              <div>
                <Label>配图描述</Label>
                <div className="space-y-2 mt-2">
                  {generated.image_prompts.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted text-sm">
                      <span className="font-medium">图{i + 1}：</span>
                      {p.description}
                      {p.style && <span className="text-muted-foreground ml-2">({p.style})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    立即发布
                  </>
                )}
              </Button>
              <Button variant="outline" disabled>
                <Clock className="h-4 w-4" />
                定时发布（开发中）
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
