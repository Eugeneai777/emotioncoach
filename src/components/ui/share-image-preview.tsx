import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareImagePreviewProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  /** Whether the image URL is a remote HTTPS URL ready for long-press saving */
  isRemoteReady?: boolean;
}

const ShareImagePreview: React.FC<ShareImagePreviewProps> = ({
  open,
  onClose,
  imageUrl,
  onRegenerate,
  isRegenerating = false,
  isRemoteReady = false,
}) => {
  const [imageSaved, setImageSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [visible, setVisible] = useState(false);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isWeChat = ua.includes('micromessenger');
  const isMiniProgram = isWeChat && (
    ua.includes('miniprogram') ||
    (typeof window !== 'undefined' && (window as unknown as { __wxjs_environment?: string }).__wxjs_environment === 'miniprogram')
  );
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  const isDesktop = !isMobile;
  const isMobileWeChat = isWeChat && isMobile;
  const isDesktopWeChat = isWeChat && isDesktop;
  const remoteReady = isRemoteReady || (!!imageUrl && /^https?:\/\//i.test(imageUrl));

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
      let extension = imageUrl.startsWith('data:image/png') ? 'png' : 'jpg';
      if (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        extension = blob.type === 'image/png' ? 'png' : 'jpg';
        downloadUrl = URL.createObjectURL(blob);
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `share-card-${Date.now()}.${extension}`;
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

  if (!open || !imageUrl) return null;

  // Determine bottom hint based on environment and remote readiness
  const renderBottomAction = () => {
    // 手机微信：长按保存（保留原行为）
    if (isMobileWeChat) {
      if (!imageLoaded) return null;
      return (
        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-base font-medium text-foreground">👆 长按上方图片保存到相册</p>
          <p className="text-muted-foreground text-xs">
            {remoteReady ? '高清图已准备好，可转发给朋友或朋友圈' : '图片已生成，正在准备高清保存图'}
          </p>
        </div>
      );
    }

    // 各类“需要按钮保存”的环境
    let hintText = '保存后可通过社交软件分享';
    if (isDesktopWeChat) {
      hintText = '保存后可拖入微信对话框发送给好友';
    } else if (isDesktop) {
      hintText = '也可右键图片选择"图片另存为"';
    } else if (isMobile) {
      hintText = '保存到相册后可在社交软件中转发';
    }

    return (
      <>
        <Button
          onClick={handleDownload}
          className="w-full max-w-sm rounded-full h-12 gap-2 text-base font-medium"
        >
          <Download className="h-5 w-5" />
          {imageSaved ? '已保存 ✓' : '保存图片'}
        </Button>
        <p className="text-muted-foreground text-xs">{hintText}</p>
      </>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-background transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="min-h-[44px] min-w-[44px]"
        >
          <X className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">预览海报</span>
        {onRegenerate ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="min-h-[44px] min-w-[44px]"
          >
            <RotateCw className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
          </Button>
        ) : (
          <div className="w-[44px]" />
        )}
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
          alt="分享海报"
          className={`max-w-full sm:max-w-[420px] w-full max-h-full object-contain rounded-2xl shadow-lg transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
          style={{
            touchAction: 'pinch-zoom',
            WebkitTouchCallout: 'default',
          }}
          onLoad={() => { setImageLoaded(true); setImageError(false); }}
          onError={() => { setImageError(true); setImageLoaded(false); }}
        />
      </div>

      {/* Bottom action */}
      <div
        className="shrink-0 flex flex-col items-center gap-2 px-4 pb-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {renderBottomAction()}
      </div>
    </div>,
    document.body
  );
};

export default ShareImagePreview;
