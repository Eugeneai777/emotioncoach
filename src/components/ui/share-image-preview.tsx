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

  // Prevent body scroll when preview is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setImageSaved(false);
      setShowTip(true);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Auto-hide tip after 5 seconds
  useEffect(() => {
    if (open && showTip) {
      const timer = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [open, showTip]);

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

  // Detect environment
  const isWeChat = typeof navigator !== 'undefined' && 
    navigator.userAgent.toLowerCase().includes('micromessenger');

  if (!open || !imageUrl) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        >
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt="分享卡片"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                style={{ 
                  touchAction: 'pinch-zoom',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'default', // Enable long-press menu on iOS
                }}
                onContextMenu={(e) => {
                  // Allow context menu for saving
                  e.stopPropagation();
                }}
              />
              
              {/* Floating save indicator for WeChat */}
              {isWeChat && showTip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-lg"
                    >
                      👆
                    </motion.span>
                    <span className="text-white text-sm font-medium">长按图片保存</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Bottom Guidance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="shrink-0 pb-safe"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex flex-col items-center gap-2 px-4">
              {isWeChat ? (
                <>
                  {/* WeChat-specific guidance */}
                  <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [1, 0.8, 1] 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
                    >
                      <span className="text-xl">👆</span>
                    </motion.div>
                    <div className="text-left">
                      <p className="text-white font-medium text-base">长按图片保存到相册</p>
                      <p className="text-white/60 text-xs">保存后可分享给好友或发朋友圈</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Non-WeChat guidance */}
                  <Button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-full px-6 py-2 h-auto gap-2"
                  >
                    <Download className="h-4 w-4" />
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