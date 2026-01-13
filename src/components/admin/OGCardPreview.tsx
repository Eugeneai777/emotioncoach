import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Copy, Check, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OGConfig } from "@/config/ogConfig";

interface OGCardPreviewProps {
  config: OGConfig;
  pageKey: string;
}

type ImageStatus = 'loading' | 'loaded' | 'error';

export function OGCardPreview({ config, pageKey }: OGCardPreviewProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>('loading');
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(config.url);
      setCopied(true);
      toast.success("已复制链接");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleVisit = () => {
    window.open(config.url, '_blank');
  };

  const getStatusIcon = () => {
    switch (imageStatus) {
      case 'loaded':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* 微信分享卡片预览 */}
      <div className="bg-muted/30 p-3">
        <div className="flex gap-3 bg-background rounded-lg p-2 border border-border/50">
          {/* 图片预览 */}
          <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
            {imageStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
            )}
            {imageStatus === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            )}
            <img
              src={config.image}
              alt={config.ogTitle}
              className={cn(
                "w-full h-full object-cover transition-opacity",
                imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
            />
          </div>

          {/* 文字内容 */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
              {config.ogTitle}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {config.description}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {config.siteName || '有劲AI'}
            </p>
          </div>
        </div>
      </div>

      {/* 配置信息 */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
            {pageKey}
          </span>
          {getStatusIcon()}
        </div>

        <div className="text-xs text-muted-foreground truncate" title={config.url}>
          {config.url.replace('https://wechat.eugenewe.net', '')}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handleVisit}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            访问
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handleCopyUrl}
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            复制
          </Button>
        </div>
      </div>
    </div>
  );
}
