import { Card } from "@/components/ui/card";
import { Sparkles, Gift, Loader2 } from "lucide-react";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import { cn } from "@/lib/utils";
import {
  dimensionConfig,
  type MidlifePersonalityType,
} from "./midlifeAwakeningData";

interface Props {
  personalityType: MidlifePersonalityType;
  internalFrictionRisk: number;
  actionPower: number;
  missionClarity: number;
  displayName?: string;
  claimCode?: string | null;
  loadingCode?: boolean;
  onClickClaim?: () => void;
  weakestDimensionLabel?: string;
}

/**
 * 中场觉醒力 Hero —— 顶部「中场行动续航」卡，对标男人有劲风格
 * 深色商务感 + 金色强调
 */
export function MidlifeAwakeningClaimReportCard({
  personalityType,
  internalFrictionRisk,
  actionPower,
  missionClarity,
  displayName,
  claimCode,
  loadingCode,
  onClickClaim,
  weakestDimensionLabel,
}: Props) {
  // 「行动续航」= 行动力 × 0.4 + 使命清晰 × 0.3 + (100 - 内耗) × 0.3
  const stamina = Math.max(
    0,
    Math.min(
      100,
      Math.round(actionPower * 0.4 + missionClarity * 0.3 + (100 - internalFrictionRisk) * 0.3),
    ),
  );

  const tier =
    stamina >= 75
      ? { label: "⚡ 续航充足", subline: "你已经把'再来一次'变成本能，把这股劲传给下一个想动的同代人" }
      : stamina >= 50
      ? { label: "🌅 待启动", subline: "想法不少，差的不是动力，是把它缩到 5 分钟" }
      : { label: "🕯️ 需要外力托一把", subline: "不是你不行，是你已经太久没替自己做过 1 件事了" };

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card
      className="relative overflow-hidden border-amber-900/40"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #312e81 70%, #1e1b4b 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      <div className="relative p-5 space-y-4 text-zinc-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amber-300/85 font-semibold">
              PRIVATE · 中场觉醒力评估报告
            </div>
            <div className="text-base font-bold mt-1">
              {displayName ? `${displayName}，这是你的中场盘面` : "这是你的中场盘面"}
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 text-right shrink-0">
            <div>{dateStr}</div>
            <div className="mt-0.5">仅你可见</div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(99,102,241,0.10) 100%)",
            border: "1px solid rgba(251,191,36,0.25)",
          }}
        >
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-xs text-amber-300/90 font-medium">
                {tier.label}
              </div>
              <div className="text-[11px] text-zinc-300/85 mt-1 leading-snug max-w-[210px]">
                {tier.subline}
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-extrabold leading-none"
                style={{
                  fontSize: 38,
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stamina}
                <span className="text-base align-top ml-0.5">%</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">行动续航</div>
            </div>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, stamina)}%`,
                background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-around text-center text-[11px] text-zinc-400">
          <div>
            <div className="font-bold text-amber-300 text-sm">30</div>
            <div className="mt-0.5">道题深度扫描</div>
          </div>
          <div className="w-px h-6 bg-zinc-700" />
          <div>
            <div className="font-bold text-amber-300 text-sm">6</div>
            <div className="mt-0.5">维度全景</div>
          </div>
          <div className="w-px h-6 bg-zinc-700" />
          <div>
            <div className="font-bold text-amber-300 text-sm">1V1</div>
            <div className="mt-0.5">顾问解读</div>
          </div>
        </div>

        {weakestDimensionLabel && (
          <div
            className="rounded-xl px-3 py-2 text-[12px] text-zinc-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(251,191,36,0.18)",
            }}
          >
            <span className="opacity-70 mr-1">最该先松的扣子：</span>
            <span className="font-semibold text-amber-300">
              {weakestDimensionLabel}
            </span>
          </div>
        )}

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
              "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(0,0,0,0.4) 100%)",
            borderColor: "rgba(251,191,36,0.4)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              }}
            >
              <Gift className="w-5 h-5 text-zinc-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">你的专属领取码</span>
                {loadingCode && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
              </div>
              <div
                className="font-mono font-extrabold tracking-[0.3em] mt-0.5"
                style={{
                  fontSize: 22,
                  background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {formatClaimCode(claimCode)}
              </div>
            </div>
            {onClickClaim && (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-zinc-300 mt-2 leading-snug">
            🎯 凭此码加顾问企微,预约一次 <b className="text-amber-300">1V1 解读</b>,拆解中场盲区,拿一份属于你的行动地图
          </div>
        </button>
      </div>
    </Card>
  );
}
