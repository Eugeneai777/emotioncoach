import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  IMMEDIATE_ACTIONS_BY_DIMENSION,
  FALLBACK_IMMEDIATE_ACTIONS,
  type VitalityDimensionKey,
} from "@/config/maleMidlifeVitalityCopy";

interface Props {
  weakestKey: VitalityDimensionKey | null;
  storageKey: string;
  /** 当用户勾选数变化时回调,用于驱动主 CTA 文案 */
  onCheckedCountChange?: (n: number) => void;
}

const STORAGE_NS = "male_vitality_actions_v1";

function readChecked(key: string): boolean[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_NS}__${key}`);
    if (!raw) return [false, false, false];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length === 3) return arr.map(Boolean);
  } catch {}
  return [false, false, false];
}

function writeChecked(key: string, val: boolean[]) {
  try {
    localStorage.setItem(`${STORAGE_NS}__${key}`, JSON.stringify(val));
  } catch {}
}

export function ImmediateActionChecklist({ weakestKey, storageKey, onCheckedCountChange }: Props) {
  const items = useMemo(
    () => (weakestKey && IMMEDIATE_ACTIONS_BY_DIMENSION[weakestKey]) || FALLBACK_IMMEDIATE_ACTIONS,
    [weakestKey],
  );
  const [checked, setChecked] = useState<boolean[]>(() => readChecked(storageKey));

  useEffect(() => {
    onCheckedCountChange?.(checked.filter(Boolean).length);
  }, [checked, onCheckedCountChange]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      writeChecked(storageKey, next);
      return next;
    });
  };

  return (
    <Card className="border-teal-200/60 bg-gradient-to-br from-teal-50/80 via-card to-amber-50/40 dark:from-teal-950/20 dark:to-amber-950/15 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-amber-500 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="font-bold text-sm text-foreground">3 件今晚 / 本周就能动手做的事</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3 ml-8">勾选后会保存,7 天内随时回来确认。</p>
        <ul className="space-y-2">
          {items.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <label
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-colors",
                  checked[i]
                    ? "bg-teal-50 dark:bg-teal-950/30 border-teal-300/70 dark:border-teal-700/60"
                    : "bg-white/70 dark:bg-card/60 border-border/50 hover:border-teal-300/60",
                )}
              >
                {/* 用原生 checkbox 保证移动端可点击,避开 44px hit-box 限制 */}
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                  className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer shrink-0"
                />
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    checked[i] ? "text-muted-foreground line-through" : "text-foreground/90",
                  )}
                >
                  {t}
                </span>
              </label>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
