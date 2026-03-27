import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCw, Download, CheckCircle2, Send } from 'lucide-react';
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
  const isAndroid = typeof navigator !== 'undefined' && 
    /android/i.test(navigator.userAgent);
  const isMobile = isWeChat || isIOS || isAndroid;

  const cleanupScrollLock = () => {
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.paddingRight = '';
    document.body.style.marginRight = '';
    document.body.style.position = '';
  };

  useEffect(() => {
    if (open) {
      setImageSaved(false);
      setImageLoaded(false);
      setImageError(false);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
      return cleanupScrollLock;
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    cleanupScrollLock();
    onClose();
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    try {
      let downloadUrl = imageUrl;
      if (!imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `share-card-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (downloadUrl !== imageUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setImageSaved(true);
      toast.success('图片已保存');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('下载失败，请长按图片保存');
    }
  }, [imageUrl]);

  const handleForward = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `share-${Date.now()}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        toast.success('转发成功');
      } else {
        toast('请长按图片转发给朋友');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast('请长按图片转发给朋友');
      }
    }
  }, [imageUrl]);

  if (!open || !imageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-background transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="min-h-[44px] min-w-[44px]"
          >
            <Download className="h-5 w-5" />
          </Button>
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
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0">
        {!imageLoaded && !imageError && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">加载中...</p>
          </div>
        )}

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
          className={`max-w-full sm:max-w-[420px] w-full max-h-full object-contain rounded-2xl shadow-lg transition-opacity duration-200 ${
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

      {/* Bottom actions */}
      <div
        className="shrink-0 flex flex-col items-center gap-3 px-4 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {isMobile ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-sm">
            <div className="flex items-center gap-2 w-full">
              <Button
                onClick={handleDownload}
                className="flex-1 rounded-full h-11 gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                保存图片
              </Button>
              {isWeChat && (
                <Button
                  onClick={handleForward}
                  variant="outline"
                  className="flex-1 rounded-full h-11 gap-2 text-sm font-medium"
                >
                  <Send className="h-4 w-4" />
                  转发给朋友
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground text-xs">👆 长按图片也可保存</span>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">返回</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 max-w-sm w-full">
            <Button
              onClick={handleDownload}
              className="rounded-full px-8 h-12 gap-2 text-base font-medium w-full"
            >
              <Download className="h-5 w-5" />
              保存图片
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="rounded-full px-8 h-11 gap-2 text-base w-full"
            >
              <X className="h-4 w-4" />
              返回
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ShareImagePreview;
