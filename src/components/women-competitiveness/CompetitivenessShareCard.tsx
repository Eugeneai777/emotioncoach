import { forwardRef } from "react";
import { categoryInfo, levelInfo, CompetitivenessCategory, CompetitivenessLevel } from "./competitivenessData";
import logoImage from "@/assets/logo-youjin-ai.png";

interface CompetitivenessShareCardProps {
  totalScore: number;
  level: CompetitivenessLevel;
  categoryScores: Record<CompetitivenessCategory, number>;
  strongestCategory: CompetitivenessCategory;
  weakestCategory: CompetitivenessCategory;
  displayName?: string;
  avatarUrl?: string;
}

const CompetitivenessShareCard = forwardRef<HTMLDivElement, CompetitivenessShareCardProps>(
  ({ totalScore, level, categoryScores, strongestCategory, weakestCategory, displayName, avatarUrl }, ref) => {
    const lvl = levelInfo[level];
    const strongest = categoryInfo[strongestCategory];
    const weakest = categoryInfo[weakestCategory];
    const categories: CompetitivenessCategory[] = ["career", "brand", "resilience", "finance", "relationship"];

    return (
      <div
        ref={ref}
        style={{
          width: 340,
          padding: 24,
          background: 'linear-gradient(135deg, #fff1f2, #faf5ff, #fff1f2)',
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          borderRadius: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 顶部用户信息 */}
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
              background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700,
            }}>
              {(displayName || '我')[0]}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {displayName || '我'}的竞争力报告
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>35+女性竞争力测评</div>
          </div>
        </div>

        {/* 核心分数 */}
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          background: `linear-gradient(135deg, ${lvl.color}22, ${lvl.color}11)`,
          borderRadius: 16,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 28 }}>{lvl.emoji}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: lvl.color, lineHeight: 1.1 }}>
            {totalScore}<span style={{ fontSize: 16, fontWeight: 500 }}>分</span>
          </div>
          <div style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 12,
            backgroundColor: lvl.color,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            marginTop: 6,
          }}>
            {lvl.name}
          </div>
        </div>

        {/* 五维度条形图 */}
        <div style={{ marginBottom: 16 }}>
          {categories.map(key => {
            const info = categoryInfo[key];
            const score = categoryScores[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, width: 18 }}>{info.emoji}</span>
                <span style={{ fontSize: 11, width: 56, color: '#475569', whiteSpace: 'nowrap' }}>{info.name}</span>
                <div style={{
                  flex: 1, height: 8, backgroundColor: '#f1f5f9',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${score}%`, height: '100%',
                    backgroundColor: info.color, borderRadius: 4,
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, width: 24, textAlign: 'right', color: '#334155' }}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        {/* 优势 & 短板 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, padding: '8px 10px', borderRadius: 10,
            backgroundColor: '#ecfdf5', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>最强维度</div>
            <div style={{ fontSize: 16 }}>{strongest.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>{strongest.name}</div>
          </div>
          <div style={{
            flex: 1, padding: '8px 10px', borderRadius: 10,
            backgroundColor: '#fffbeb', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>待突破</div>
            <div style={{ fontSize: 16 }}>{weakest.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>{weakest.name}</div>
          </div>
        </div>

        {/* 底部品牌 */}
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

CompetitivenessShareCard.displayName = 'CompetitivenessShareCard';

export default CompetitivenessShareCard;
