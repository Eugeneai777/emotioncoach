import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function UpgradeHintCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <div>
            <p className="text-xs text-slate-700">想要持续突破？</p>
            <p className="text-[10px] text-slate-500">测评后可加入财富觉醒训练营</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
          <span>¥299</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
