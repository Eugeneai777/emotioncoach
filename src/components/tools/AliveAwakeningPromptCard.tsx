import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { awakeningDimensions, AwakeningDimension } from "@/config/awakeningConfig";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AliveAwakeningPromptCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDimension: (dimension: AwakeningDimension) => void;
}

export const AliveAwakeningPromptCard = ({
  open,
  onOpenChange,
  onSelectDimension,
}: AliveAwakeningPromptCardProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-rose-200 dark:border-rose-800">
        <VisuallyHidden>
          <DialogTitle>选择觉察维度</DialogTitle>
          <DialogDescription>选择一个维度开始觉察练习</DialogDescription>
        </VisuallyHidden>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 opacity-90" />
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-8 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />

          {/* Content */}
          <div className="relative z-10 p-6 text-white">
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header - 引导语 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-4"
            >
              <p className="text-lg text-white/80 mb-1">
                我此刻的生命状态
              </p>
              <p className="text-xl font-semibold">
                卡在哪里？ 🔍
              </p>
              <p className="text-sm text-white/60 mt-2">
                选择一个维度，开始觉察
              </p>
            </motion.div>

            {/* 四层支持价值说明 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/10"
            >
              <p className="text-xs text-white/90 font-medium mb-2 text-center">
                ✨ 一次觉察，开启四层支持
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: '📝', label: '轻点记录', desc: '开始觉察' },
                  { emoji: '🪞', label: 'AI看见你', desc: '5维回应' },
                  { emoji: '💬', label: '深度对话', desc: '专属教练' },
                  { emoji: '🌱', label: '系统成长', desc: '21天蜕变' },
                ].map((layer, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-2 bg-white/10 rounded-lg p-2"
                  >
                    <span className="text-base">{layer.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-white font-medium">{layer.label}</span>
                      <span className="text-[10px] text-white/60">{layer.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dimension grid - 2x3 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 mb-5"
            >
              {awakeningDimensions.map((dimension, index) => (
                <motion.button
                  key={dimension.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onOpenChange(false);
                    onSelectDimension(dimension);
                  }}
                  className={`
                    relative p-4 rounded-xl text-left transition-all
                    bg-gradient-to-br ${dimension.gradient}
                    hover:shadow-lg hover:scale-[1.02]
                    border border-white/20
                  `}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl">{dimension.emoji}</span>
                    <span className="font-medium">{dimension.title}</span>
                    <span className="text-xs text-white/70">
                      {dimension.id === 'emotion' && '看见情绪'}
                      {dimension.id === 'gratitude' && '记录美好'}
                      {dimension.id === 'action' && '小步前进'}
                      {dimension.id === 'decision' && '理清选择'}
                      {dimension.id === 'relation' && '连接他人'}
                      {dimension.id === 'direction' && '探索目标'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Skip button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full text-white/80 hover:text-white hover:bg-white/10"
              >
                下次再说
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
