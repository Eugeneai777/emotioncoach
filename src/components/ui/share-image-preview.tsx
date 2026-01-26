import React, { useEffect, useState, useCallback } from 'react';
import { X, RotateCw, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showTip, setShowTip] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Detect environment
  const isWeChat = typeof navigator !== 'undefined' && 
    navigator.userAgent.toLowerCase().includes('micromessenger');
  const isIOS = typeof navigator !== 'undefined' && 
    /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

  // Prevent body scroll when preview is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setImageSaved(false);
      setShowTip(true);
      setImageLoaded(false);
      setImageError(false);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Keep tip visible longer for WeChat/iOS (don't auto-hide)
  useEffect(() => {
    if (open && showTip && !isWeChat && !isIOS) {
      const timer = setTimeout(() => setShowTip(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [open, showTip, isWeChat, isIOS]);

  // Handle download for non-WeChat environments
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

  // Handle image load
  const handleImageLoad = useCallback(() => {
    console.log('[ShareImagePreview] Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Handle image error
  const handleImageError = useCallback(() => {
    console.error('[ShareImagePreview] Image failed to load');
    setImageError(true);
    setImageLoaded(false);
  }, []);

  if (!open || !imageUrl) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.01 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0.01 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="flex items-center justify-between p-3 sm:p-4 text-white shrink-0 safe-area-top"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {imageSaved && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-emerald-400 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>已保存</span>
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!isWeChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
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
                  className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                >
                  <RotateCw className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </motion.div>

          {/* Image Container */}
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0.01 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Loading state */}
              {!imageLoaded && !imageError && (
                <div className="flex flex-col items-center justify-center p-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <p className="text-white/60 text-sm mt-3">加载中...</p>
                </div>
              )}

              {/* Error state */}
              {imageError && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-4xl mb-3">😕</span>
                  <p className="text-white text-base mb-2">图片加载失败</p>
                  <p className="text-white/60 text-sm mb-4">请点击重新生成</p>
                  {onRegenerate && (
                    <Button
                      onClick={onRegenerate}
                      disabled={isRegenerating}
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      <RotateCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                      重新生成
                    </Button>
                  )}
                </div>
              )}

              <img
                src={imageUrl}
                alt="分享卡片"
                className={`max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                style={{ 
                  touchAction: 'pinch-zoom',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'default', // Enable long-press menu on iOS
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onContextMenu={(e) => {
                  // Allow context menu for saving
                  e.stopPropagation();
                }}
              />
              
            </motion.div>
          </div>

          {/* Bottom Guidance */}
          <motion.div
            initial={{ y: 20, opacity: 0.01 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="shrink-0 pb-safe"
            style={{ 
              transform: 'translateZ(0)', 
              willChange: 'transform, opacity',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' 
            }}
          >
            <div className="flex flex-col items-center gap-3 px-4">
              {(isWeChat || isIOS) ? (
                <>
                  {/* WeChat/iOS-specific guidance - More prominent */}
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ 
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(16,185,129,0.3)',
                        '0 0 0 8px rgba(16,185,129,0)',
                        '0 0 0 0 rgba(16,185,129,0)'
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 w-full max-w-sm"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.15, 1],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                    >
                      <span className="text-2xl">👆</span>
                    </motion.div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-base">长按上方图片保存</p>
                      <p className="text-white/70 text-sm mt-0.5">保存后可分享给好友或发朋友圈</p>
                    </div>
                  </motion.div>
                  
                  {/* Secondary hint */}
                  <p className="text-white/40 text-xs text-center">
                    💡 保存后打开微信，发送给好友或分享朋友圈
                  </p>
                </>
              ) : (
                <>
                  {/* Non-WeChat guidance */}
                  <Button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-full px-8 py-3 h-auto gap-2 text-base font-medium"
                  >
                    <Download className="h-5 w-5" />
                    保存图片
                  </Button>
                  <p className="text-white/50 text-xs text-center">
                    保存后可分享给好友
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareImagePreview;