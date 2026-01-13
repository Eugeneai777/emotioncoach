import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, Image as ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { OGConfig } from "@/config/ogConfig";
import { useUpsertOGConfiguration, useDeleteOGConfiguration, uploadOGImage } from "@/hooks/useOGConfigurations";
import { supabase } from "@/integrations/supabase/client";

const AI_STYLE_OPTIONS = [
  { value: 'brand', label: '品牌风格', desc: '紫色/粉色渐变' },
  { value: 'warm', label: '温暖风格', desc: '橙色/金色暖调' },
  { value: 'professional', label: '专业风格', desc: '蓝色/灰色商务' },
  { value: 'nature', label: '自然风格', desc: '绿色自然元素' },
  { value: 'cosmic', label: '宇宙风格', desc: '深蓝星空紫色' },
];

interface OGEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageKey: string;
  defaultConfig: OGConfig;
  customConfig?: {
    title?: string | null;
    og_title?: string | null;
    description?: string | null;
    image_url?: string | null;
    url?: string | null;
  } | null;
}

export function OGEditDialog({
  open,
  onOpenChange,
  pageKey,
  defaultConfig,
  customConfig,
}: OGEditDialogProps) {
  const [title, setTitle] = useState(customConfig?.title || defaultConfig.title);
  const [ogTitle, setOgTitle] = useState(customConfig?.og_title || defaultConfig.ogTitle);
  const [description, setDescription] = useState(customConfig?.description || defaultConfig.description);
  const [imageUrl, setImageUrl] = useState(customConfig?.image_url || defaultConfig.image);
  const [isUploading, setIsUploading] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiStyle, setAiStyle] = useState("brand");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upsertMutation = useUpsertOGConfiguration();
  const deleteMutation = useDeleteOGConfiguration();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error("请上传 PNG、JPG 或 WebP 格式的图片");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadOGImage(file, pageKey);
      setImageUrl(url);
      toast.success("图片上传成功");
    } catch (error) {
      toast.error("图片上传失败");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    await upsertMutation.mutateAsync({
      page_key: pageKey,
      title,
      og_title: ogTitle,
      description,
      image_url: imageUrl,
      url: defaultConfig.url,
    });
    onOpenChange(false);
  };

  const handleReset = async () => {
    await deleteMutation.mutateAsync(pageKey);
    setTitle(defaultConfig.title);
    setOgTitle(defaultConfig.ogTitle);
    setDescription(defaultConfig.description);
    setImageUrl(defaultConfig.image);
    onOpenChange(false);
  };

  const hasCustomConfig = !!customConfig;
  const descLength = description?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑 OG 配置</DialogTitle>
          <DialogDescription>
            页面: <code className="bg-muted px-1 rounded">{pageKey}</code>
            {hasCustomConfig && (
              <span className="ml-2 text-amber-500">（已自定义）</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Image Preview & Upload */}
          <div className="space-y-2">
            <Label>OG 图片</Label>
            <div className="flex gap-4 items-start">
              <div className="relative w-40 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="OG Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="图片URL"
                  className="text-sm"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  上传新图片
                </Button>
                <p className="text-xs text-muted-foreground">
                  推荐尺寸: 1200×630px，PNG/JPG/WebP，最大 5MB
                </p>
                
                {/* AI Generation */}
                <div className="pt-3 border-t border-border/50 mt-3 space-y-2">
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    AI 智能生成
                  </div>
                  <Input
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="输入关键词，如：财富、成长、突破"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Select value={aiStyle} onValueChange={setAiStyle}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span>{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!aiKeywords.trim()) {
                          toast.error("请输入关键词");
                          return;
                        }
                        setIsGenerating(true);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const response = await supabase.functions.invoke('generate-og-image', {
                            body: { 
                              keywords: aiKeywords,
                              style: aiStyle,
                              pageKey
                            },
                            headers: {
                              Authorization: `Bearer ${session?.access_token}`
                            }
                          });
                          
                          if (response.error) throw response.error;
                          if (response.data?.imageUrl) {
                            setImageUrl(response.data.imageUrl);
                            toast.success("AI 图片生成成功");
                          } else {
                            throw new Error(response.data?.error || "生成失败");
                          }
                        } catch (error: unknown) {
                          const msg = error instanceof Error ? error.message : "生成失败";
                          toast.error(msg);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating || !aiKeywords.trim()}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      生成图片
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI 会生成 1200×630 的专业分享图（无文字）
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">页面标题 (title)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="页面标题"
            />
          </div>

          {/* OG Title */}
          <div className="space-y-2">
            <Label htmlFor="ogTitle">OG 标题 (og:title)</Label>
            <Input
              id="ogTitle"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="分享卡片标题"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">描述 (og:description)</Label>
              <span className={`text-xs ${descLength > 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {descLength}/30 字符
              </span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享卡片描述（建议30字符以内）"
              rows={2}
            />
            {descLength > 30 && (
              <p className="text-xs text-destructive">
                ⚠️ 微信可能会截断超过30字符的描述
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>微信分享预览</Label>
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex gap-3 bg-background rounded-lg p-2 border border-border/50">
                <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2">
                    {ogTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    有劲AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {hasCustomConfig && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={deleteMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              恢复默认
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
