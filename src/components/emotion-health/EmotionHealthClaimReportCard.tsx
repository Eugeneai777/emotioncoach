import { Card } from "@/components/ui/card";
import { Sparkles, Gift, Loader2 } from "lucide-react";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import { cn } from "@/lib/utils";

interface Props {
  energyIndex: number;
  anxietyIndex: number;
  stressIndex: number;
  displayName?: string;
  claimCode?: string | null;
  loadingCode?: boolean;
  onClickClaim?: () => void;
}

/**
 * 35+ 女性「专属能量报告卡」 —— 顶部 Hero
 * 复用男版 ReportCard 信息密度，但改为玫瑰金渐变 + 女性叙事
 */
export function EmotionHealthClaimReportCard({
  energyIndex,
  anxietyIndex,
  stressIndex,
  displayName,
  claimCode,
  loadingCode,
  onClickClaim,
}: Props) {
  // 「女性能量电量」= 100 - 焦虑/压力均值，再叠加 energyIndex 的正向（取整）
  // 让能量条始终落在 0-100，越高越好
  const fatigueAvg = (anxietyIndex + stressIndex) / 2;
  const battery = Math.max(0, Math.min(100, Math.round((100 - fatigueAvg) * 0.6 + energyIndex * 0.4)));

  const tier =
    battery >= 80
      ? { label: "✨ 能量满格", subline: "你正处在节奏感很好的阶段，继续守住自己的边界" }
      : battery >= 50
      ? { label: "🌸 续航中", subline: "整体可控，但有几处暗流值得在下方报告里看清" }
      : { label: "🕯️ 需要充电", subline: "你不是不够好，是真的累了。下方有为你准备的恢复路径" };

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card
      className="relative overflow-hidden border-rose-200/60 dark:border-rose-900/60"
      style={{
        background:
          "linear-gradient(135deg, #fdf2f8 0%, #fef3f2 35%, #fdf4ff 65%, #faf5ff 100%)",
      }}
    >
      {/* 顶部光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(244,114,182,0.28) 0%, rgba(244,114,182,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(192,38,211,0.18) 0%, rgba(192,38,211,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      <div className="relative p-5 space-y-4">
        {/* 头：私密报告 + 称呼 + 日期 */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-rose-700/80 dark:text-rose-300/80 font-semibold">
              PRIVATE REPORT · 「她」专属能量报告
            </div>
            <div className="text-base font-bold text-foreground mt-1">
              {displayName ? `${displayName}，这是你的能量画像` : "这是为你生成的专属能量画像"}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-right shrink-0">
            <div>{dateStr}</div>
            <div className="mt-0.5">仅你可见</div>
          </div>
        </div>

        {/* 电量条 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(192,38,211,0.10) 100%)",
            border: "1px solid rgba(244,114,182,0.25)",
          }}
        >
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-xs text-rose-700/80 dark:text-rose-300/80 font-medium">
                {tier.label}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug max-w-[200px]">
                {tier.subline}
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-extrabold leading-none"
                style={{
                  fontSize: 38,
                  background: "linear-gradient(135deg, #ec4899 0%, #c026d3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {battery}
                <span className="text-base align-top ml-0.5">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">能量电量</div>
            </div>
          </div>
          <div className="h-2 bg-white/70 dark:bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, battery)}%`,
                background: "linear-gradient(90deg, #f472b6 0%, #c026d3 100%)",
              }}
            />
          </div>
        </div>

        {/* 价值感数字 */}
        <div className="flex items-center justify-around text-center text-[11px] text-muted-foreground">
          <div>
            <div className="font-bold text-rose-700 dark:text-rose-300 text-sm">32</div>
            <div className="mt-0.5">道题深度分析</div>
          </div>
          <div className="w-px h-6 bg-rose-200 dark:bg-rose-900" />
          <div>
            <div className="font-bold text-rose-700 dark:text-rose-300 text-sm">3</div>
            <div className="mt-0.5">维度能量画像</div>
          </div>
          <div className="w-px h-6 bg-rose-200 dark:bg-rose-900" />
          <div>
            <div className="font-bold text-rose-700 dark:text-rose-300 text-sm">1</div>
            <div className="mt-0.5">份专属 PDF</div>
          </div>
        </div>

        {/* 领取码区 */}
        <button
          onClick={onClickClaim}
          disabled={!onClickClaim}
          className={cn(
            "w-full text-left rounded-2xl p-4 transition-all",
            "border border-dashed",
            onClickClaim ? "hover:shadow-md active:scale-[0.99] cursor-pointer" : "cursor-default"
          )}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(253,242,248,0.85) 100%)",
            borderColor: "rgba(192,38,211,0.4)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #f472b6 0%, #c026d3 100%)",
              }}
            >
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">你的专属领取码</span>
                {loadingCode && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
              <div
                className="font-mono font-extrabold tracking-[0.3em] mt-0.5"
                style={{
                  fontSize: 22,
                  background: "linear-gradient(90deg, #ec4899 0%, #c026d3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {formatClaimCode(claimCode)}
              </div>
            </div>
            {onClickClaim && (
              <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 leading-snug">
            🎁 凭此码加助教企微，免费领取你的<b className="text-foreground">完整 PDF 深度报告</b>
            ，由助教 1v1 解读
          </div>
        </button>
      </div>
    </Card>
  );
}
