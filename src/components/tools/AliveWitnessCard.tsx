import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface AliveWitnessCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  witness: string;
  streak: number;
  date: Date;
  onProceedToAwakening?: () => void;
}

const getTimeOfDayEmoji = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '🌅';
  if (hour >= 12 && hour < 17) return '☀️';
  if (hour >= 17 && hour < 21) return '🌆';
  return '🌙';
};

export const AliveWitnessCard = ({
  open,
  onOpenChange,
  witness,
  streak,
  date,
  onProceedToAwakening,
}: AliveWitnessCardProps) => {
  const timeEmoji = getTimeOfDayEmoji();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-rose-200 dark:border-rose-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 opacity-90" />
          
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

            {/* Date header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm">
                <span>{timeEmoji}</span>
                <span>{format(date, "yyyy年M月d日 EEEE", { locale: zhCN })}</span>
              </div>
            </div>

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </motion.div>

            {/* Witness message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-4"
            >
              <p className="text-xl font-medium leading-relaxed px-2">
                "{witness}"
              </p>
            </motion.div>

            {/* Streak */}
            {streak > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">
                    连续打卡 <span className="font-bold text-lg">{streak}</span> 天
                  </span>
                </div>
              </motion.div>
            )}

            {/* Action buttons - Two stage: close or proceed to awakening */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                好的，今天就这样
              </Button>
              
              {onProceedToAwakening && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onProceedToAwakening();
                  }}
                  className="flex-1 bg-white/30 hover:bg-white/40 text-white border-0"
                >
                  想觉察一下 ✨
                </Button>
              )}
            </motion.div>

            {/* Footer hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-white/70 mt-4"
            >
              今天也活得很好，这就是最好的消息 💗
            </motion.p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
