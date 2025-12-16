import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BriefingData {
  emotion_theme: string;
  emotion_tags?: string[];
  emotion_intensity?: number;
  insight?: string;
  action?: string;
  growth_story?: string;
}

interface EmotionVoiceBriefingPreviewProps {
  briefingId: string;
  briefingData: BriefingData;
  onClose: () => void;
}

export function EmotionVoiceBriefingPreview({ 
  briefingId, 
  briefingData, 
  onClose 
}: EmotionVoiceBriefingPreviewProps) {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const handleViewFull = () => {
    navigate('/history');
    onClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200/50 dark:border-emerald-800/50 shadow-xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors z-10"
              >
                <X className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>

              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                      简报已生成
                    </h3>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
                      你的情绪旅程已记录
                    </p>
                  </div>
                </div>

                {/* Emotion theme */}
                <div className="mb-4">
                  <div className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mb-1">
                    今日情绪主题
                  </div>
                  <p className="text-lg font-medium text-emerald-800 dark:text-emerald-200">
                    {briefingData.emotion_theme}
                  </p>
                </div>

                {/* Emotion tags */}
                {briefingData.emotion_tags && briefingData.emotion_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {briefingData.emotion_tags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Insight preview */}
                {briefingData.insight && (
                  <div className="p-3 rounded-lg bg-white/60 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      核心洞察
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 line-clamp-2">
                      {briefingData.insight}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 pt-2 flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                  稍后查看
                </Button>
                <Button
                  onClick={handleViewFull}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-1"
                >
                  查看完整简报
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
