import { forwardRef } from "react";
import qiweiQr from "@/assets/qiwei-assistant-qr.jpg";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import {
  categoryInfo,
  type CompetitivenessCategory,
} from "./competitivenessData";

interface Props {
  claimCode?: string | null;
  displayName?: string;
  avatarUrl?: string;
  totalScore: number;
  categoryScores: Record<CompetitivenessCategory, number>;
  weakestCategory: CompetitivenessCategory;
  strongestCategory: CompetitivenessCategory;
  levelName?: string;
}

/**
 * 35+ 女性竞争力 PDF 凭证海报（750px 离屏渲染）
 * 玫瑰金渐变 / 「她」叙事 / inline styles 兼容 html2canvas
 */
const CompetitivenessPdfClaimCard = forwardRef<HTMLDivElement, Props>(
  (
    {
      claimCode,
      displayName,
      avatarUrl,
      totalScore,
      categoryScores,
      weakestCategory,
      strongestCategory,
      levelName,
    },
    ref
  ) => {
    const cats = Object.keys(categoryInfo) as CompetitivenessCategory[];
    const strongest = categoryInfo[strongestCategory];
    const weakest = categoryInfo[weakestCategory];
    return (
      <div
        ref={ref}
        style={{
          width: 750,
          background:
            "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #fae8ff 60%, #f5d0fe 100%)",
          color: "#3b0764",
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
              "radial-gradient(circle, rgba(244,114,182,0.45) 0%, rgba(244,114,182,0) 70%)",
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
              "radial-gradient(circle, rgba(192,38,211,0.32) 0%, rgba(192,38,211,0) 70%)",
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
              color: "#be185d",
              fontWeight: 700,
            }}
          >
            🌸 35+ 「她」专属筹码盘
          </div>
          <div style={{ fontSize: 13, color: "#86198f", opacity: 0.7 }}>
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
              background: "linear-gradient(135deg, #f472b6 0%, #c026d3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 16px rgba(192,38,211,0.25)",
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
                color: "#3b0764",
                marginBottom: 4,
              }}
            >
              {displayName || "亲爱的姐姐"}
            </div>
            <div style={{ fontSize: 13, color: "#86198f", opacity: 0.75 }}>
              35+ 女性竞争力测评 · 已完成 27 道题
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(244,114,182,0.3)",
            borderRadius: 16,
            padding: "18px 22px",
            marginBottom: 20,
            boxShadow: "0 4px 16px rgba(244,114,182,0.08)",
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
            <div style={{ fontSize: 14, color: "#86198f", fontWeight: 600 }}>
              竞争力总分{levelName ? ` · ${levelName}` : ""}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                background: "linear-gradient(135deg, #ec4899 0%, #c026d3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {totalScore}
              <span style={{ fontSize: 18 }}>分</span>
            </div>
          </div>
          <div
            style={{
              height: 10,
              background: "rgba(255,255,255,0.7)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(2, totalScore)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f472b6 0%, #c026d3 100%)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* 5 维筹码 */}
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {cats.map((k) => {
            const info = categoryInfo[k];
            const v = categoryScores[k];
            return (
              <div
                key={k}
                style={{
                  background: "rgba(255,255,255,0.55)",
                  borderRadius: 12,
                  padding: "10px 6px",
                  textAlign: "center",
                  border: "1px solid rgba(244,114,182,0.2)",
                }}
              >
                <div style={{ fontSize: 16 }}>{info.emoji}</div>
                <div style={{ fontSize: 10, color: "#86198f", marginTop: 4, lineHeight: 1.2 }}>
                  {info.name}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: info.color,
                    marginTop: 4,
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(244,114,182,0.25)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: "#3b0764", marginBottom: 6 }}>
            <span style={{ color: "#86198f", marginRight: 6 }}>💪 最值钱的牌：</span>
            <b>{strongest.name}</b>
          </div>
          <div style={{ fontSize: 13, color: "#3b0764" }}>
            <span style={{ color: "#86198f", marginRight: 6 }}>🎯 最该重新出的牌：</span>
            <b>{weakest.name}</b>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg, rgba(244,114,182,0.22) 0%, rgba(192,38,211,0.22) 100%)",
            border: "1.5px dashed rgba(192,38,211,0.55)",
            borderRadius: 20,
            padding: "24px 24px 28px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#86198f",
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
              background: "linear-gradient(135deg, #ec4899 0%, #c026d3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 24px rgba(192,38,211,0.25)",
            }}
          >
            {formatClaimCode(claimCode)}
          </div>
          <div style={{ fontSize: 13, color: "#be185d", fontWeight: 500 }}>
            🔒 仅限本人凭码领取 · 24 小时内送达
          </div>
        </div>

        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 14,
            color: "#86198f",
            marginBottom: 14,
            fontWeight: 500,
          }}
        >
          ↓ 长按识别二维码，添加你的「专属助教」 ↓
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
              boxShadow: "0 8px 24px rgba(192,38,211,0.18)",
            }}
          >
            <img
              src={qiweiQr}
              alt="专属助教"
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
            color: "#86198f",
            opacity: 0.7,
            marginBottom: 4,
          }}
        >
          扫码添加 · 助教企微（YouJin Assistant）
        </div>
        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 11,
            color: "#86198f",
            opacity: 0.5,
            marginTop: 18,
          }}
        >
          仅供本人使用，请勿外传 · 有劲AI · 「她的中场」出品
        </div>
      </div>
    );
  }
);

CompetitivenessPdfClaimCard.displayName = "CompetitivenessPdfClaimCard";
export default CompetitivenessPdfClaimCard;
