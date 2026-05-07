import { forwardRef } from "react";
import qiweiQr from "@/assets/qiwei-operation-qr.jpg";
import { formatClaimCode } from "@/utils/claimCodeUtils";

interface MaleVitalityPdfClaimCardProps {
  claimCode?: string | null;
  displayName?: string;
  avatarUrl?: string;
  statusPercent: number;
  statusLabel: string;
}

/**
 * 「专属凭证」品牌海报卡 — 用户截图后发给运营换 PDF
 * 固定宽度 750px，深色渐变 + 大领取码 + 企微二维码
 * 用 inline styles 兼容 html2canvas
 */
const MaleVitalityPdfClaimCard = forwardRef<HTMLDivElement, MaleVitalityPdfClaimCardProps>(
  ({ claimCode, displayName, avatarUrl, statusPercent, statusLabel }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 750,
          background:
            "linear-gradient(160deg, #0B1220 0%, #11192C 45%, #1A1030 100%)",
          color: "#fff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          padding: "48px 44px 56px",
          position: "relative",
          overflow: "hidden",
          borderRadius: 0,
        }}
      >
        {/* 顶部品牌色光晕 */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0) 70%)",
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
              "radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0) 70%)",
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
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 2,
              color: "#F59E0B",
              fontWeight: 600,
            }}
          >
            ⚡ 男人有劲状态
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            EUGENE · 你的专属凭证
          </div>
        </div>

        {/* 用户信息 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #F59E0B 0%, #6366F1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.15)",
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
              (displayName || "U").slice(0, 1).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {displayName || "测评者"}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              男人有劲状态测评 · 已完成
            </div>
          </div>
        </div>

        {/* 状态指数 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            padding: "20px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            状态指数
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#F59E0B",
              lineHeight: 1,
            }}
          >
            {statusPercent}
            <span style={{ fontSize: 20, marginLeft: 4 }}>%</span>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(245,158,11,0.15)",
              color: "#F59E0B",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* 领取码主区 */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(99,102,241,0.18) 100%)",
            border: "1.5px dashed rgba(245,158,11,0.55)",
            borderRadius: 20,
            padding: "28px 24px 32px",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 6,
              letterSpacing: 1,
            }}
          >
            ━━━━━━━━ 你的领取码 ━━━━━━━━
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: 12,
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              marginTop: 8,
              marginBottom: 12,
              textShadow: "0 2px 24px rgba(245,158,11,0.4)",
            }}
          >
            {formatClaimCode(claimCode)}
          </div>
          <div style={{ fontSize: 14, color: "#FCD34D", fontWeight: 500 }}>
            🔒 仅限本人凭码领取 · 24 小时内送达
          </div>
        </div>

        {/* 报码引导 */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 14,
            color: "rgba(255,255,255,0.65)",
            marginBottom: 16,
          }}
        >
          ↓ 长按识别二维码，添加你的 EUGENE 专属顾问 ↓
        </div>

        {/* 企微二维码 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 14,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <img
              src={qiweiQr}
              alt="EUGENE 顾问微信"
              crossOrigin="anonymous"
              style={{ width: 220, height: 220, display: "block" }}
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 4,
          }}
        >
          扫码添加 · EUGENE 私人顾问
        </div>
        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginTop: 24,
          }}
        >
          仅供本人使用，请勿外传 · EUGENE 出品
        </div>
      </div>
    );
  },
);

MaleVitalityPdfClaimCard.displayName = "MaleVitalityPdfClaimCard";
export default MaleVitalityPdfClaimCard;
