import { forwardRef } from "react";
import qiweiQr from "@/assets/qiwei-assistant-qr.jpg";
import { formatClaimCode } from "@/utils/claimCodeUtils";

interface Props {
  claimCode?: string | null;
  displayName?: string;
  avatarUrl?: string;
  battery: number; // 0-100 能量电量
  energyIndex: number;
  anxietyIndex: number;
  stressIndex: number;
  patternName?: string;
  blockedName?: string;
}

/**
 * 35+ 女性「专属凭证」海报 —— 用户截图发给助教换 PDF 报告
 * 750px 离屏渲染，inline styles 兼容 html2canvas
 * 玫瑰金渐变区别于男版深色商务感
 */
const EmotionHealthPdfClaimCard = forwardRef<HTMLDivElement, Props>(
  (
    {
      claimCode,
      displayName,
      avatarUrl,
      battery,
      energyIndex,
      anxietyIndex,
      stressIndex,
      patternName,
      blockedName,
    },
    ref
  ) => {
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
        {/* 光晕 */}
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

        {/* 顶部品牌行 */}
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
            🌸 「她」专属能量报告
          </div>
          <div style={{ fontSize: 13, color: "#86198f", opacity: 0.7 }}>
            PRIVATE · 仅供本人
          </div>
        </div>

        {/* 用户信息 */}
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
              情绪健康测评 · 已完成 32 道题
            </div>
          </div>
        </div>

        {/* 能量电量条 */}
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
              能量电量
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
              {battery}
              <span style={{ fontSize: 18 }}>%</span>
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
                width: `${Math.max(2, battery)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f472b6 0%, #c026d3 100%)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* 三维指标 */}
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
            { label: "情绪能量", value: energyIndex, color: "#10b981" },
            { label: "焦虑张力", value: anxietyIndex, color: "#f59e0b" },
            { label: "压力负载", value: stressIndex, color: "#ef4444" },
          ].map((d) => (
            <div
              key={d.label}
              style={{
                background: "rgba(255,255,255,0.55)",
                borderRadius: 12,
                padding: "12px 10px",
                textAlign: "center",
                border: "1px solid rgba(244,114,182,0.2)",
              }}
            >
              <div style={{ fontSize: 12, color: "#86198f", marginBottom: 4 }}>
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
              <div style={{ fontSize: 10, color: "#a1a1aa", marginTop: 4 }}>
                /100
              </div>
            </div>
          ))}
        </div>

        {/* 关键画像 */}
        {(patternName || blockedName) && (
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
            {patternName && (
              <div style={{ fontSize: 13, color: "#3b0764", marginBottom: 6 }}>
                <span style={{ color: "#86198f", marginRight: 6 }}>🌷 反应模式：</span>
                <b>{patternName}</b>
              </div>
            )}
            {blockedName && (
              <div style={{ fontSize: 13, color: "#3b0764" }}>
                <span style={{ color: "#86198f", marginRight: 6 }}>🎯 行动阻滞：</span>
                <b>{blockedName}</b>
              </div>
            )}
          </div>
        )}

        {/* 领取码主区 */}
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

        {/* 二维码引导 */}
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
          仅供本人使用，请勿外传 · 有劲AI · 「她」能量出品
        </div>
      </div>
    );
  }
);

EmotionHealthPdfClaimCard.displayName = "EmotionHealthPdfClaimCard";
export default EmotionHealthPdfClaimCard;
