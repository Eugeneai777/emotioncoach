import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MilestoneEvent } from "@/hooks/useProgressMilestones";

interface MilestoneAchievementOverlayProps {
  milestone: MilestoneEvent | null;
  onDismiss: () => void;
  /** 自动消失毫秒数，默认 1800ms */
  duration?: number;
}

/**
 * "中央成就浮卡"——居中淡入弹跳，1.8s 自动淡出。
 * - pointer-events-none：不阻塞作答点击
 * - 无遮罩、无关闭按钮，纯视觉激励
 * - framer-motion 全端兼容（iOS / Android WebView / 微信小程序 webview / PC）
 */
export function MilestoneAchievementOverlay({
  milestone,
  onDismiss,
  duration = 1800,
}: MilestoneAchievementOverlayProps) {
  useEffect(() => {
    if (!milestone) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [milestone, duration, onDismiss]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key={milestone.id}
          className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center px-4"
          style={{ paddingTop: "30vh" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 px-6 py-5 shadow-2xl shadow-orange-300/50 ring-1 ring-white/40"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 14 }}
                className="text-5xl drop-shadow-md"
              >
                {milestone.emoji}
              </motion.span>
              <p className="max-w-[260px] text-base font-semibold text-white drop-shadow-sm">
                {milestone.message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
