import React, { useEffect } from 'react';
import { X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Prevent body scroll when preview is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open || !imageUrl) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 text-white shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
            <span className="text-sm font-medium text-white/80">图片预览</span>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isRegenerating}
                className="text-white hover:bg-white/20 gap-2"
              >
                <RotateCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                重新生成
              </Button>
            )}
          </div>

          {/* Image Container - Optimized for mobile touch */}
          <div 
            className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={imageUrl}
              alt="分享卡片"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ 
                touchAction: 'pinch-zoom',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Bottom Guidance - Enhanced for mobile */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 pb-safe shrink-0"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {/* Long-press animation hint */}
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [1, 0.8, 1] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <span className="text-lg">👆</span>
                </motion.div>
                <span className="text-white text-base font-medium">长按图片保存</span>
              </div>
              
              <p className="text-white/60 text-xs text-center">
                保存后可发送给朋友或分享到朋友圈
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareImagePreview;