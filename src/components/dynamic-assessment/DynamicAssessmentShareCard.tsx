import { forwardRef } from "react";
import logoImage from "@/assets/logo-youjin-ai.png";

interface DimensionScore {
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface DynamicAssessmentShareCardProps {
  totalScore: number;
  maxScore: number;
  dimensionScores: DimensionScore[];
  primaryPattern?: {
    label?: string;
    emoji?: string;
    description?: string;
  };
  templateEmoji: string;
  templateTitle: string;
  displayName?: string;
  avatarUrl?: string;
}

const DynamicAssessmentShareCard = forwardRef<HTMLDivElement, DynamicAssessmentShareCardProps>(
  ({ totalScore, maxScore, dimensionScores, primaryPattern, templateEmoji, templateTitle, displayName, avatarUrl }, ref) => {
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    // Ring SVG params
    const ringR = 38;
    const ringC = 2 * Math.PI * ringR;
    const ringOffset = ringC * (1 - percentage / 100);

    return (
      <div
        ref={ref}
        style={{
          width: 340,
          padding: 24,
          background: 'linear-gradient(135deg, #f0f9ff, #faf5ff, #fff1f2)',
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          borderRadius: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700,
            }}>
              {(displayName || '我')[0]}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {displayName || '我'}的测评报告
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{templateTitle}</div>
          </div>
        </div>

        {/* Score ring */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={ringR} fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="50" cy="50" r={ringR}
                fill="none" stroke="#6366f1" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 24 }}>{primaryPattern?.emoji || templateEmoji}</span>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {totalScore}<span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>/{maxScore}</span>
            </div>
            {primaryPattern?.label && (
              <div style={{
                display: 'inline-block', marginTop: 6,
                padding: '3px 14px', borderRadius: 12,
                backgroundColor: '#6366f1', color: '#fff',
                fontSize: 13, fontWeight: 600,
              }}>
                {primaryPattern.label}
              </div>
            )}
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{ marginBottom: 16 }}>
          {dimensionScores.map((d) => {
            const pct = d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0;
            return (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, width: 18 }}>{d.emoji}</span>
                <span style={{ fontSize: 11, width: 56, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.label}
                </span>
                <div style={{ flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    backgroundColor: pct >= 80 ? '#22c55e' : pct >= 50 ? '#6366f1' : '#f97316',
                    borderRadius: 4,
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, width: 32, textAlign: 'right', color: '#334155' }}>
                  {d.score}/{d.maxScore}
                </span>
              </div>
            );
          })}
        </div>

        {/* Description */}
        {primaryPattern?.description && (
          <div style={{
            padding: '8px 12px', borderRadius: 10,
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: 12, color: '#475569', lineHeight: 1.5,
            marginBottom: 16,
          }}>
            {primaryPattern.description}
          </div>
        )}

        {/* Brand footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, paddingTop: 12, borderTop: '1px solid #f1f5f9',
        }}>
          <img
            src={logoImage}
            alt="有劲AI"
            style={{ width: 20, height: 20, borderRadius: '50%' }}
            crossOrigin="anonymous"
          />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Powered by 有劲AI</span>
        </div>
      </div>
    );
  }
);

DynamicAssessmentShareCard.displayName = 'DynamicAssessmentShareCard';

export default DynamicAssessmentShareCard;
