import { cn } from "@/lib/utils";
import { getStatusBand } from "@/config/maleMidlifeVitalityCopy";

interface Props {
  statusPercent: number;
  className?: string;
}

/** 0–5 格电量条 + 状态文字 */
export function EnergyBarBadge({ statusPercent, className }: Props) {
  const bars = Math.max(0, Math.min(5, Math.round(statusPercent / 20)));
  const band = getStatusBand(statusPercent);
  const barColor =
    band.color === "emerald"
      ? "bg-emerald-500"
      : band.color === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";
  const textColor =
    band.color === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : band.color === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/70 dark:bg-card/70 border border-border/50 backdrop-blur-sm",
        className,
      )}
    >
      <span className="text-base leading-none">🔋</span>
      <div className="flex items-end gap-[3px] h-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-1.5 rounded-sm transition-colors",
              i < bars ? barColor : "bg-muted-foreground/20",
            )}
            style={{ height: `${50 + i * 10}%` }}
          />
        ))}
      </div>
      <span className={cn("text-xs font-bold tabular-nums", textColor)}>
        {statusPercent}%
      </span>
      <span className={cn("text-xs font-semibold", textColor)}>{band.headline}</span>
    </div>
  );
}
