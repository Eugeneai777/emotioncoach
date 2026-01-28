/**
 * Partner Plan Share Card Component
 * 
 * Standalone poster card for one-click sharing via useOneClickShare hook.
 * Supports 4 content templates: income, products, easystart, testimonial.
 */

import { forwardRef } from 'react';
import { PARTNER_CARD_STYLES, PartnerCardContentTemplate } from '@/config/partnerShareCardStyles';

interface PartnerPlanShareCardProps {
  contentTemplate?: PartnerCardContentTemplate;
  className?: string;
}

const styles = PARTNER_CARD_STYLES.classic.styles;

// =============== Income Template ===============
const IncomeTemplate = () => (
  <>
    {/* Header */}
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
        分享真实故事，持续获得佣金收入
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
        💵 收益预测（30%转化率假设）
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: styles.textSecondary }}>💪 初级合伙人</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: styles.successColor }}>净利润 ¥2,169</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: styles.textSecondary }}>🔥 高级合伙人</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: styles.successColor }}>净利润 ¥18,158</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: styles.textSecondary }}>💎 钻石合伙人</span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: styles.accentColor }}>净利润 ¥66,544</span>
      </div>
    </div>

    {/* Key Highlight */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
      borderLeft: `3px solid ${styles.accentColor}`,
    }}>
      <p style={{ fontSize: '14px', color: styles.textPrimary, lineHeight: '1.5' }}>
        <strong>钻石合伙人</strong> 比高级只多投入 ¥1,733<br/>
        却能多赚 <span style={{ color: styles.accentColor, fontWeight: '700' }}>¥48,386</span>，30天回本！
      </p>
    </div>

    {/* Disclaimer */}
    <div style={{
      backgroundColor: styles.warningBg,
      borderRadius: '6px',
      padding: '10px 12px',
      marginBottom: '16px',
    }}>
      <p style={{ fontSize: '11px', color: styles.warningText, lineHeight: '1.4' }}>
        ⚠️ 收入预测仅供参考，实际收益因个人能力和市场变化而异。
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
  </>
);

// =============== Products Template ===============
const ProductsTemplate = () => (
  <>
    {/* Header */}
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
        🚀 有劲合伙人
      </div>
      <h2 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        background: styles.titleGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
      }}>
        11款产品可分成
      </h2>
      <p style={{ fontSize: '14px', color: styles.subtitleColor }}>
        覆盖情绪、财富、亲子三大场景
      </p>
    </div>

    {/* 3 Scenarios */}
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    }}>
      {[
        { emoji: '💚', title: '情绪场景', desc: '测评+AI教练' },
        { emoji: '💰', title: '财富场景', desc: '测评+训练营' },
        { emoji: '💜', title: '亲子场景', desc: '双轨+训练营' },
      ].map((item, i) => (
        <div key={i} style={{
          flex: 1,
          backgroundColor: styles.cardBg,
          borderRadius: '8px',
          padding: '12px 8px',
          textAlign: 'center',
          boxShadow: styles.cardShadow,
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.emoji}</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: styles.textPrimary, marginBottom: '2px' }}>{item.title}</div>
          <div style={{ fontSize: '10px', color: styles.textMuted }}>{item.desc}</div>
        </div>
      ))}
    </div>

    {/* Product Ladder */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
    }}>
      <p style={{ fontSize: '13px', color: styles.textPrimary, marginBottom: '10px', fontWeight: '600' }}>
        📈 产品升级路径
      </p>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        color: styles.textSecondary,
      }}>
        <span style={{ padding: '4px 8px', backgroundColor: styles.tagBg, borderRadius: '4px' }}>9.9元测评</span>
        <span>→</span>
        <span style={{ padding: '4px 8px', backgroundColor: styles.tagBg, borderRadius: '4px' }}>365会员</span>
        <span>→</span>
        <span style={{ padding: '4px 8px', backgroundColor: styles.tagBg, borderRadius: '4px' }}>299训练营</span>
      </div>
    </div>

    {/* Commission Rates */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: styles.textSecondary }}>✔ 一级佣金</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: styles.successColor }}>18% - 50%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: styles.textSecondary }}>✔ 二级佣金（钻石）</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: styles.accentColor }}>12%</span>
      </div>
    </div>

    {/* CTA */}
    <div style={{
      background: styles.ctaGradient,
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '14px', fontWeight: '600', color: styles.ctaText }}>
        扫码了解完整产品矩阵
      </p>
    </div>
  </>
);

// =============== Easy Start Template ===============
const EasyStartTemplate = () => (
  <>
    {/* Header */}
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
        ✨ 普通人的 AI 赚钱机会
      </div>
      <h2 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        background: styles.titleGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
      }}>
        有劲合伙人 · 分享即收益
      </h2>
    </div>

    {/* What you DON'T need */}
    <div style={{
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '12px',
    }}>
      <p style={{ fontSize: '12px', color: '#991b1b', marginBottom: '10px', fontWeight: '600' }}>
        你不需要：
      </p>
      {['技术背景', '大量流量', '拍视频、做内容'].map((item, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: i < 2 ? '6px' : 0,
        }}>
          <span style={{ color: '#dc2626', fontSize: '14px' }}>✗</span>
          <span style={{ fontSize: '13px', color: '#7f1d1d' }}>{item}</span>
        </div>
      ))}
    </div>

    {/* What you DO need */}
    <div style={{
      backgroundColor: '#f0fdf4',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
    }}>
      <p style={{ fontSize: '12px', color: '#166534', marginBottom: '10px', fontWeight: '600' }}>
        你只需要：
      </p>
      {[
        '分享你的真实成长故事',
        '792元起步，含100份体验包',
        '全产品 18%-50% 佣金',
      ].map((item, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: i < 2 ? '6px' : 0,
        }}>
          <span style={{ color: '#16a34a', fontSize: '14px' }}>✓</span>
          <span style={{ fontSize: '13px', color: '#14532d' }}>{item}</span>
        </div>
      ))}
    </div>

    {/* Key Message */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '14px', color: styles.textPrimary, lineHeight: '1.5' }}>
        AI 负责所有价值交付<br/>
        <strong style={{ color: styles.accentColor }}>你做得越真实，AI 帮你赚钱越多</strong>
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
        扫码开启你的 AI 副业
      </p>
    </div>
  </>
);

// =============== Testimonial Template ===============
const TestimonialTemplate = () => (
  <>
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <div style={{
        fontSize: '14px',
        color: styles.tagText,
        backgroundColor: styles.tagBg,
        padding: '4px 12px',
        borderRadius: '9999px',
        display: 'inline-block',
        marginBottom: '12px',
      }}>
        💬 真实用户说
      </div>
    </div>

    {/* Quote */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '12px',
      padding: '20px 16px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        fontSize: '32px',
        color: styles.tagBg,
        fontFamily: 'serif',
        lineHeight: 1,
      }}>"</div>
      <p style={{ 
        fontSize: '15px', 
        color: styles.textPrimary, 
        lineHeight: '1.7',
        marginTop: '20px',
        marginBottom: '16px',
        fontStyle: 'italic',
      }}>
        第一个月只是把有劲推荐给了5个朋友，没想到3个月后他们都成了付费用户，还发展了自己的学员...
      </p>
      <div style={{ 
        textAlign: 'right',
        fontSize: '13px',
        color: styles.textMuted,
      }}>
        ── 王女士，钻石合伙人
      </div>
    </div>

    {/* Benefits */}
    <div style={{
      backgroundColor: styles.cardBg,
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '16px',
      boxShadow: styles.cardShadow,
    }}>
      {[
        { text: '分享真实体验，自然吸引同频用户', icon: '✔' },
        { text: 'AI产品复购率高，持续产生佣金', icon: '✔' },
        { text: '二级团队让收益指数级增长', icon: '✔' },
      ].map((item, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: i < 2 ? '8px' : 0,
        }}>
          <span style={{ color: styles.successColor, fontSize: '13px' }}>{item.icon}</span>
          <span style={{ fontSize: '13px', color: styles.textSecondary }}>{item.text}</span>
        </div>
      ))}
    </div>

    {/* Tagline */}
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <p style={{
        fontSize: '16px',
        fontWeight: 'bold',
        background: styles.titleGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        有劲合伙人 · 让好产品自己说话
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
        扫码了解真实案例
      </p>
    </div>
  </>
);

const PartnerPlanShareCard = forwardRef<HTMLDivElement, PartnerPlanShareCardProps>(
  ({ contentTemplate = 'income' }, ref) => {

    const renderContent = () => {
      switch (contentTemplate) {
        case 'income':
          return <IncomeTemplate />;
        case 'products':
          return <ProductsTemplate />;
        case 'easystart':
          return <EasyStartTemplate />;
        case 'testimonial':
          return <TestimonialTemplate />;
        default:
          return <IncomeTemplate />;
      }
    };

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
        {renderContent()}

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
