import { forwardRef } from "react";
import qiweiQr from "@/assets/qiwei-assistant-qr.jpg";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import {
  type MidlifeDimensionScore,
  type MidlifePersonalityType,
  personalityTypeConfig,
  dimensionConfig,
} from "./midlifeAwakeningData";

interface Props {
  claimCode?: string | null;
  displayName?: string;
  avatarUrl?: string;
  personalityType: MidlifePersonalityType;
  dimensions: MidlifeDimensionScore[];
  internalFrictionRisk: number;
  actionPower: number;
  missionClarity: number;
  weakestDimensionLabel?: string;
}

/**
 * 中场觉醒力 PDF 凭证海报（750px 离屏渲染）
 * 深色 + 金色，对标男版商务感
 */
const MidlifeAwakeningPdfClaimCard = forwardRef<HTMLDivElement, Props>(
  (
    {
      claimCode,
      displayName,
      avatarUrl,
      personalityType,
      dimensions,
      internalFrictionRisk,
      actionPower,
      missionClarity,
      weakestDimensionLabel,
    },
    ref
  ) => {
    const persona = personalityTypeConfig[personalityType];
    const stamina = Math.max(
      0,
      Math.min(
        100,
        Math.round(actionPower * 0.4 + missionClarity * 0.3 + (100 - internalFrictionRisk) * 0.3),
      ),
    );
    return (
      <div
        ref={ref}
        style={{
          width: 750,
          background:
            "linear-gradient(160deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #1e1b4b 100%)",
          color: "#e0e7ff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          padding: "48px 44px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0) 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -160,
            width: 460,
            height: 460,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(99,102,241,0) 70%)",
            filter: "blur(20px)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 2,
              color: "#fbbf24",
              fontWeight: 700,
            }}
          >
            ⚡ 中场觉醒 · 私密评估
          </div>
          <div style={{ fontSize: 13, color: "#a5b4fc", opacity: 0.7 }}>
            PRIVATE · 仅供本人
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: "0 4px 16px rgba(251,191,36,0.25)",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              (displayName || "你").slice(0, 1).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: 4,
              }}
            >
              {displayName || "中场同代人"}
            </div>
            <div style={{ fontSize: 13, color: "#a5b4fc", opacity: 0.85 }}>
              中场觉醒力测评 · 已完成 30 道题
            </div>
          </div>
        </div>

        {/* 续航主卡 */}
        <div
          style={{
            position: "relative",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 16,
            padding: "18px 22px",
            marginBottom: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 600 }}>
              行动续航 · {persona.name}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {stamina}
              <span style={{ fontSize: 18 }}>%</span>
            </div>
          </div>
          <div
            style={{
              height: 10,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(2, stamina)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* 三大核心指标 */}
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "内耗风险", value: internalFrictionRisk, color: "#f87171", lower: true },
            { label: "行动力", value: actionPower, color: "#34d399", lower: false },
            { label: "使命清晰", value: missionClarity, color: "#fbbf24", lower: false },
          ].map((d) => (
            <div
              key={d.label}
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 12,
                padding: "12px 10px",
                textAlign: "center",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 4 }}>
                {d.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: d.color,
                  lineHeight: 1,
                }}
              >
                {d.value}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                {d.lower ? "越低越好" : "越高越好"}
              </div>
            </div>
          ))}
        </div>

        {/* 6 维度小条 */}
        <div
          style={{
            position: "relative",
            background: "rgba(0,0,0,0.25)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 8 }}>
            六维全景
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
            {dimensions.map((d) => {
              const cfg = dimensionConfig[d.dimension];
              return (
                <div
                  key={d.dimension}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#e0e7ff",
                  }}
                >
                  <span>{cfg.icon}</span>
                  <span style={{ flex: 1 }}>{cfg.shortName}</span>
                  <b style={{ color: "#fbbf24" }}>{d.score}</b>
                </div>
              );
            })}
          </div>
          {weakestDimensionLabel && (
            <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 10 }}>
              🎯 最该先松的扣子：<b>{weakestDimensionLabel}</b>
            </div>
          )}
        </div>

        {/* 领取码 */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.18) 100%)",
            border: "1.5px dashed rgba(251,191,36,0.55)",
            borderRadius: 20,
            padding: "24px 24px 28px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#fbbf24",
              marginBottom: 4,
              letterSpacing: 1,
            }}
          >
            ━━━━━━ 你的专属领取码 ━━━━━━
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: 10,
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              marginTop: 6,
              marginBottom: 10,
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 24px rgba(251,191,36,0.35)",
            }}
          >
            {formatClaimCode(claimCode)}
          </div>
          <div style={{ fontSize: 13, color: "#fde68a", fontWeight: 500 }}>
            🔒 仅限本人凭码领取 · 24 小时内送达
          </div>
        </div>

        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 14,
            color: "#fbbf24",
            marginBottom: 14,
            fontWeight: 500,
          }}
        >
          ↓ 长按识别二维码，添加你的「专属顾问」 ↓
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 14,
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <img
              src={qiweiQr}
              alt="专属顾问"
              crossOrigin="anonymous"
              style={{ width: 220, height: 220, display: "block" }}
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 12,
            color: "#a5b4fc",
            opacity: 0.7,
            marginBottom: 4,
          }}
        >
          扫码添加 · 顾问企微（YouJin Assistant）
        </div>
        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 11,
            color: "#a5b4fc",
            opacity: 0.5,
            marginTop: 18,
          }}
        >
          仅供本人使用，请勿外传 · 有劲AI · 「中场觉醒」出品
        </div>
      </div>
    );
  }
);

MidlifeAwakeningPdfClaimCard.displayName = "MidlifeAwakeningPdfClaimCard";
export default MidlifeAwakeningPdfClaimCard;
