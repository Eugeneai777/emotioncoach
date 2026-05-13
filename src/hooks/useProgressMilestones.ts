import { useCallback, useRef, useState } from "react";

export interface MilestoneEvent {
  threshold: number;
  emoji: string;
  message: string;
  id: number;
}

const DEFAULT_MILESTONES: Omit<MilestoneEvent, "id">[] = [
  { threshold: 25, emoji: "🌱", message: "很棒！已完成 1/4，继续保持～" },
  { threshold: 50, emoji: "⭐", message: "太棒了！已经过半，你做得很好！" },
  { threshold: 75, emoji: "🔥", message: "冲刺阶段！马上就要完成了！" },
  { threshold: 90, emoji: "🎯", message: "最后几题！胜利在望！" },
];

const DENSE_MILESTONES: Omit<MilestoneEvent, "id">[] = [
  { threshold: 15, emoji: "🌿", message: "已完成 1/7，先稳住节奏～" },
  { threshold: 30, emoji: "🌱", message: "已经走过 30%，节奏不错！" },
  { threshold: 45, emoji: "⭐", message: "接近一半啦，再加把劲！" },
  { threshold: 60, emoji: "💪", message: "过 60% 了，再坚持一下！" },
  { threshold: 75, emoji: "🔥", message: "冲刺阶段！马上就要完成了！" },
  { threshold: 90, emoji: "🎯", message: "最后几题！胜利在望！" },
];

interface UseProgressMilestonesOptions {
  dense?: boolean;
}

/**
 * 进度激励 Hook：根据进度百分比触发"中央成就浮卡"。
 * - dense=true 用于 60+ 题的长测评（如 SCL-90），共 6 个里程碑
 * - 默认 4 个里程碑（25/50/75/90%）
 * - 内部去重，每个阈值仅触发一次
 */
export function useProgressMilestones(options: UseProgressMilestonesOptions = {}) {
  const { dense = false } = options;
  const milestones = dense ? DENSE_MILESTONES : DEFAULT_MILESTONES;
  const shownRef = useRef<Set<number>>(new Set());
  const idRef = useRef(0);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);

  const trigger = useCallback(
    (progressPct: number) => {
      for (const m of milestones) {
        if (progressPct >= m.threshold && !shownRef.current.has(m.threshold)) {
          shownRef.current.add(m.threshold);
          idRef.current += 1;
          setActiveMilestone({ ...m, id: idRef.current });
          break;
        }
      }
    },
    [milestones]
  );

  const dismiss = useCallback(() => setActiveMilestone(null), []);

  const reset = useCallback(() => {
    shownRef.current.clear();
    setActiveMilestone(null);
  }, []);

  return { activeMilestone, trigger, dismiss, reset };
}
