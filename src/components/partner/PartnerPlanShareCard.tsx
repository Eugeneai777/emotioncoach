/**
 * Partner Plan Share Card Component
 * 
 * Standalone poster card for one-click sharing via useOneClickShare hook.
 * Used for the Youjin Partner Plan page sharing functionality.
 * Supports 4 visual templates: classic, professional, minimal, energetic.
 */

import { forwardRef } from 'react';
import { PARTNER_CARD_STYLES, PartnerCardTemplate } from '@/config/partnerShareCardStyles';

interface PartnerPlanShareCardProps {
  template?: PartnerCardTemplate;
  className?: string;
}

const PartnerPlanShareCard = forwardRef<HTMLDivElement, PartnerPlanShareCardProps>(
  ({ template = 'classic' }, ref) => {
    const styles = PARTNER_CARD_STYLES[template].styles;

    return (
      <div
        ref={ref}
        style={{
          width: '360px',
          padding: '24px',
          backgroundColor: styles.background,
          borderRadius: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Poster Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            color: styles.tagText,
            backgroundColor: styles.tagBg,
            padding: '4px 12px',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '12px',
          }}>
            🌟 AI 时代最佳副业机会
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: styles.titleGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            有劲合伙人 · 让 AI 为你赚钱
          </h2>
          <p style={{ fontSize: '14px', color: styles.subtitleColor }}>
            在 AI 大浪潮中，靠 AI 赚到第一桶金
          </p>
        </div>

        {/* Key Points */}
        <div style={{
          backgroundColor: styles.cardBg,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: styles.cardShadow,
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: styles.textPrimary }}>
            ✔ 不需要技术、不需要流量、不需要拍视频
          </p>
          <p style={{ fontSize: '14px', color: styles.textSecondary, marginBottom: '8px' }}>
            你只需要：<span style={{ fontWeight: '600', color: styles.accentColor }}>分享真实成长故事</span>
          </p>
          <p style={{ fontSize: '14px', color: styles.textSecondary }}>
            可推广：<span style={{ fontWeight: '600' }}>11款产品</span>覆盖情绪、财富、亲子三大场景
          </p>
        </div>

        {/* Income Preview */}
        <div style={{
          backgroundColor: styles.cardBg,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: styles.cardShadow,
        }}>
          <p style={{ fontSize: '12px', color: styles.textMuted, marginBottom: '12px' }}>
            收益预测（30%转化率假设）
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: styles.textSecondary }}>💪 初级合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: styles.successColor }}>净利润 ¥2,169</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: styles.textSecondary }}>🔥 高级合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: styles.successColor }}>净利润 ¥18,158</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: styles.textSecondary }}>💎 钻石合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: styles.successColor }}>净利润 ¥66,544</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          backgroundColor: styles.warningBg,
          borderRadius: '6px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', color: styles.warningText, lineHeight: '1.4' }}>
            ⚠️ 收入预测仅供参考，实际收益因个人能力和市场变化而异，不构成收益承诺。
          </p>
        </div>

        {/* CTA */}
        <div style={{
          background: styles.ctaGradient,
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: styles.ctaText }}>
            扫码了解详情 或 访问有劲App
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: styles.footerText }}>
            有劲 · 让情绪成为力量
          </p>
        </div>
      </div>
    );
  }
);

PartnerPlanShareCard.displayName = 'PartnerPlanShareCard';

export default PartnerPlanShareCard;
