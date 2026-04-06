import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RefreshCw, Plus, Eye, Send, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

interface WechatArticle {
  id: string;
  title: string;
  digest: string | null;
  content_html: string | null;
  cover_image_url: string | null;
  status: string;
  publish_error: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  target_product: string | null;
  story_theme: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: '草稿', color: 'bg-muted text-muted-foreground', icon: FileText },
  publishing: { label: '发布中', color: 'bg-amber-100 text-amber-700', icon: Clock },
  published: { label: '已发布', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function WechatArticlesManagement() {
  const [articles, setArticles] = useState<WechatArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<WechatArticle | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wechat_articles' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('加载文章列表失败');
      console.error(error);
    } else {
      setArticles((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleGenerate = async (autoPublish = false) => {
    setGenerating(true);
    toast.info(autoPublish ? '正在生成并发布文章...' : '正在生成文章草稿...', { duration: 10000 });

    try {
      const { data, error } = await supabase.functions.invoke('generate-wechat-article', {
        body: { action: autoPublish ? 'generate_and_publish' : 'generate_only' },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`文章「${data.title}」${autoPublish ? '已发布' : '已生成'}！`);
      } else {
        toast.error(data?.error || '生成失败');
      }
      fetchArticles();
    } catch (err) {
      toast.error('生成失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (articleId: string) => {
    setPublishing(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-wechat-article', {
        body: { action: 'publish', article_id: articleId },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success('文章已发布到公众号！');
      } else {
        toast.error(data?.error || '发布失败');
      }
      fetchArticles();
    } catch (err) {
      toast.error('发布失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">公众号文章管理</h2>
          <p className="text-muted-foreground text-sm mt-1">AI自动生成 · 每日推送到微信公众号</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" onClick={() => handleGenerate(false)} disabled={generating}>
            <Plus className="h-4 w-4 mr-2" />
            {generating ? '生成中...' : '生成草稿'}
          </Button>
          <Button onClick={() => handleGenerate(true)} disabled={generating}>
            <Send className="h-4 w-4 mr-2" />
            {generating ? '处理中...' : '生成并发布'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无文章，点击上方按钮生成第一篇</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const statusInfo = STATUS_MAP[article.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {article.cover_image_url && (
                      <img
                        src={article.cover_image_url}
                        alt="封面"
                        className="w-24 h-16 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{article.title}</h3>
                        <Badge variant="outline" className={`shrink-0 ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{article.digest}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>创建: {new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                        {article.published_at && (
                          <span>发布: {new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
                        )}
                        {article.story_theme && <span>主题: {article.story_theme}</span>}
                      </div>
                      {article.status === 'failed' && article.publish_error && (
                        <p className="text-xs text-red-500 mt-1 truncate">错误: {article.publish_error}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewArticle(article)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(article.status === 'draft' || article.status === 'failed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(article.id)}
                          disabled={publishing === article.id}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {publishing === article.id ? '发布中' : '发布'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>预览: {previewArticle?.title}</DialogTitle>
          </DialogHeader>
          {previewArticle?.content_html && (
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{ __html: previewArticle.content_html }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
