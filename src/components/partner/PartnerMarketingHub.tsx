import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Copy, Check, Trash2, Star, Loader2, MessageSquare, BookOpen, Video, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PartnerMarketingHubProps {
  partnerId: string;
}

interface MarketingCopy {
  id: string;
  copy_type: string;
  title: string | null;
  content: string;
  is_favorite: boolean;
  created_at: string;
}

const COPY_TYPES = [
  { value: "wechat_moment", label: "朋友圈", icon: MessageSquare, description: "简洁有力的转发文案" },
  { value: "xiaohongshu", label: "小红书", icon: BookOpen, description: "种草笔记风格" },
  { value: "short_video", label: "短视频脚本", icon: Video, description: "口播脚本+画面提示" },
  { value: "poster_text", label: "海报文案", icon: Image, description: "标题+卖点+号召语" },
];

export function PartnerMarketingHub({ partnerId }: PartnerMarketingHubProps) {
  const [selectedType, setSelectedType] = useState("wechat_moment");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copies, setCopies] = useState<MarketingCopy[]>([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCopies();
  }, [partnerId]);

  const loadCopies = async () => {
    setLoadingCopies(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-copy", {
        body: { action: "list", partner_id: partnerId },
      });
      if (error) throw error;
      setCopies(data.copies || []);
    } catch (err) {
      console.error("Load copies error:", err);
    } finally {
      setLoadingCopies(false);
    }
  };

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("请输入产品/服务信息");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-copy", {
        body: { action: "generate", partner_id: partnerId, copy_type: selectedType, context: context.trim() },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setGeneratedContent(data.content);
      if (data.saved) {
        setCopies((prev) => [data.saved, ...prev]);
      }
      toast.success("文案生成成功！");
    } catch (err: any) {
      toast.error("生成失败: " + (err.message || "请重试"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (copyId: string) => {
    try {
      await supabase.functions.invoke("generate-partner-copy", {
        body: { action: "delete", partner_id: partnerId, copy_id: copyId },
      });
      setCopies((prev) => prev.filter((c) => c.id !== copyId));
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleToggleFavorite = async (copyId: string) => {
    try {
      const { data } = await supabase.functions.invoke("generate-partner-copy", {
        body: { action: "toggle_favorite", partner_id: partnerId, copy_id: copyId },
      });
      setCopies((prev) =>
        prev.map((c) => (c.id === copyId ? { ...c, is_favorite: data.is_favorite } : c))
      );
    } catch {
      toast.error("操作失败");
    }
  };

  const typeLabel = (type: string) => COPY_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-1" />
            AI生成
          </TabsTrigger>
          <TabsTrigger value="history">
            历史文案 ({copies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-4">
          {/* Type selector - horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {COPY_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`shrink-0 w-[140px] sm:w-auto p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{type.description}</div>
                </button>
              );
            })}
          </div>

          {/* Context input */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="text-sm font-medium">描述你的产品/服务/活动</label>
              <Textarea
                placeholder="例如：7天情绪管理训练营，帮助职场妈妈学会情绪调节，每天15分钟AI教练陪练，原价299现在体验价9.9元..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleGenerate}
                disabled={generating || !context.trim()}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI正在创作...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成{COPY_TYPES.find((t) => t.value === selectedType)?.label}文案
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated result */}
          {generatedContent && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    生成结果
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(generatedContent)}
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedContent}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {loadingCopies ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : copies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>还没有生成过文案</p>
                <p className="text-sm mt-1">切换到"AI生成"标签开始创作</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {copies.map((copy) => (
                <Card key={copy.id} className={copy.is_favorite ? "border-amber-300" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {typeLabel(copy.copy_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(copy.created_at), "MM/dd HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleFavorite(copy.id)}
                        >
                          <Star
                            className={`w-4 h-4 ${copy.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(copy.content)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(copy.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed line-clamp-6">
                      {copy.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
