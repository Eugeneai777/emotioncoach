import React from 'react';
import { X, Download, RotateCw } from 'lucide-react';
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
  if (!open || !imageUrl) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          onClick={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
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

          {/* Image Container */}
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={imageUrl}
              alt="分享卡片"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ touchAction: 'pinch-zoom' }}
            />
          </div>

          {/* Bottom Guidance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 pb-8 text-center"
          >
            {/* Long-press animation hint */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
              >
                <span className="text-sm">👆</span>
              </motion.div>
              <span className="text-white text-sm font-medium">长按图片保存</span>
            </div>
            
            <p className="text-white/70 text-xs">
              保存后发送给朋友或分享到朋友圈
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareImagePreview;
