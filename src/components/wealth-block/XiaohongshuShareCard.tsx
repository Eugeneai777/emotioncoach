import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';
import { getPatternConfig } from '@/config/reactionPatternConfig';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface XiaohongshuShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  healthScore?: number;
  reactionPattern?: string;
  dominantPoor?: string;
}

const poorNameMap: Record<string, string> = {
  mouth: '嘴穷', hand: '手穷', eye: '眼穷', heart: '心穷',
};

const XiaohongshuShareCard = forwardRef<HTMLDivElement, XiaohongshuShareCardProps>(
  ({ className, avatarUrl, displayName, partnerInfo, healthScore = 68, reactionPattern = 'chase', dominantPoor = 'mouth' }, ref) => {
    const patternConfig = getPatternConfig(reactionPattern);
    const displayPattern = patternConfig?.name || reactionPattern;
    const poorName = poorNameMap[dominantPoor] || dominantPoor;

    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-assessment-lite`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };

    const { qrCodeUrl } = useQRCode(getShareUrl());

    const getScoreLabel = (s: number) => {
      if (s >= 80) return '高度觉醒';
      if (s >= 60) return '逐步觉醒';
      if (s >= 40) return '初步觉醒';
      return '觉醒起步';
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: 340,
          background: 'linear-gradient(160deg, #1a0a0a 0%, #3b0d0d 30%, #1a0a0a 100%)',
          borderRadius: 16,
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Top decorative bar */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #b8860b, #ffd700, #b8860b)',
        }} />

        {/* Header */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid #ffd700',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16,
                }}>
                  {displayName?.[0] || '财'}
                </div>
              )}
            </div>
            <div>
              <p style={{ color: '#ffd700', fontSize: 13, fontWeight: 600, margin: 0 }}>
                {displayName || '财富探索者'}
              </p>
              <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: 10, margin: 0 }}>
                AI财富觉醒诊断
              </p>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,215,0,0.6)', fontSize: 11, margin: '0 0 4px', letterSpacing: 2 }}>
              ── 马上觉醒 ──
            </p>
            <h2 style={{
              color: '#ffd700', fontSize: 22, fontWeight: 800, margin: 0,
              textShadow: '0 0 20px rgba(255,215,0,0.3)',
            }}>
              我的财富觉醒报告
            </h2>
          </div>
        </div>

        {/* Score + Pattern */}
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: 10, margin: '0 0 4px' }}>觉醒指数</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ color: '#ffd700', fontSize: 36, fontWeight: 800 }}>{healthScore}</span>
                  <span style={{ color: 'rgba(255,215,0,0.4)', fontSize: 14 }}>/100</span>
                </div>
                <p style={{ color: 'rgba(255,215,0,0.6)', fontSize: 10, margin: '2px 0 0' }}>
                  {getScoreLabel(healthScore)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: 10, margin: '0 0 6px' }}>反应模式</p>
                <span style={{
                  display: 'inline-block', padding: '4px 12px',
                  background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.5)',
                  borderRadius: 20, color: '#fca5a5', fontSize: 13, fontWeight: 600,
                }}>
                  {displayPattern}
                </span>
                <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: 10, margin: '6px 0 0' }}>主导卡点</p>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', marginTop: 2,
                  background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)',
                  borderRadius: 20, color: '#ffd700', fontSize: 12, fontWeight: 500,
                }}>
                  {poorName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <p style={{ color: 'rgba(255,215,0,0.7)', fontSize: 11, fontWeight: 600, margin: '0 0 8px' }}>
              🔍 诊断发现
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#ffd700', fontSize: 12 }}>🎯</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  行为/情绪/信念三层深度扫描
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#ffd700', fontSize: 12 }}>💡</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  30个真实财富场景精准定位
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#ffd700', fontSize: 12 }}>🐴</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  马年第一步：看见你的财富盲区
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code CTA */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(255,215,0,0.1))',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 12, padding: 14,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#ffd700', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
                扫码测你的财富卡点
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                ¥9.9 含AI语音1对1解读
              </p>
            </div>
            {qrCodeUrl && (
              <div style={{
                width: 72, height: 72, borderRadius: 8, overflow: 'hidden',
                background: '#fff', padding: 4,
              }}>
                <img src={qrCodeUrl} alt="二维码" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '8px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,215,0,0.35)', fontSize: 10, margin: 0 }}>
            Powered by 有劲AI · 马上觉醒
          </p>
        </div>
      </div>
    );
  }
);

XiaohongshuShareCard.displayName = 'XiaohongshuShareCard';

export default XiaohongshuShareCard;
