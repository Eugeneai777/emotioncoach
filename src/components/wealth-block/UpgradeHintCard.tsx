import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function UpgradeHintCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="p-3 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-800/40 border border-slate-700/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400/70" />
          <div>
            <p className="text-xs text-slate-300">想要持续突破？</p>
            <p className="text-[10px] text-slate-500">测评后可加入21天训练营</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span>¥299</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
