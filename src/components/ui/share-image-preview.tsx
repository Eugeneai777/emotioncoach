import React, { useEffect, useState, useCallback } from 'react';
import { X, RotateCw, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareImagePreviewProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const ShareImagePreview: React.FC<ShareImagePreviewProps> = ({
  open,
  onClose,
  imageUrl,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [imageSaved, setImageSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [visible, setVisible] = useState(false);

  const isWeChat = typeof navigator !== 'undefined' && 
    navigator.userAgent.toLowerCase().includes('micromessenger');
  const isIOS = typeof navigator !== 'undefined' && 
    /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

  // Fade-in on open
  useEffect(() => {
    if (open) {
      setImageSaved(false);
      setImageLoaded(false);
      setImageError(false);
      // Trigger CSS transition after mount
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.paddingRight = '';
        document.body.style.marginRight = '';
        document.body.style.position = '';
      };
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `share-card-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImageSaved(true);
      toast.success('图片已保存');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('下载失败，请长按图片保存');
    }
  }, [imageUrl]);

  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-background transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px]"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-1">
          {imageSaved && (
            <span className="flex items-center gap-1 text-primary text-sm">
              <CheckCircle2 className="h-4 w-4" />
              已保存
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isWeChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="min-h-[44px] min-w-[44px]"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="min-h-[44px] min-w-[44px]"
            >
              <RotateCw className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0">
        {/* Loading */}
        {!imageLoaded && !imageError && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">加载中...</p>
          </div>
        )}

        {/* Error */}
        {imageError && (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">😕</span>
            <p className="text-foreground text-base">图片加载失败</p>
            <p className="text-muted-foreground text-sm">请点击重新生成</p>
            {onRegenerate && (
              <Button onClick={onRegenerate} disabled={isRegenerating} variant="secondary">
                <RotateCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                重新生成
              </Button>
            )}
          </div>
        )}

        <img
          src={imageUrl}
          alt="分享卡片"
          className={`max-w-[420px] w-full rounded-2xl shadow-lg transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
          style={{
            touchAction: 'pinch-zoom',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'default',
          }}
          onLoad={() => { setImageLoaded(true); setImageError(false); }}
          onError={() => { setImageError(true); setImageLoaded(false); }}
          onContextMenu={(e) => e.stopPropagation()}
        />
      </div>

      {/* Bottom guidance */}
      <div
        className="shrink-0 flex flex-col items-center gap-3 px-4 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {(isWeChat || isIOS) ? (
          <div className="flex items-center gap-3 bg-muted rounded-2xl px-5 py-3 max-w-sm w-full">
            <span className="text-2xl shrink-0">👆</span>
            <div>
              <p className="text-foreground font-medium text-sm">长按上方图片保存</p>
              <p className="text-muted-foreground text-xs mt-0.5">保存后可分享给好友或发朋友圈</p>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleDownload}
            className="rounded-full px-8 h-12 gap-2 text-base font-medium"
          >
            <Download className="h-5 w-5" />
            保存图片
          </Button>
        )}
      </div>
    </div>
  );
};

export default ShareImagePreview;
