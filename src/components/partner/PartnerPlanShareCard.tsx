/**
 * Partner Plan Share Card Component
 * 
 * Standalone poster card for one-click sharing via useOneClickShare hook.
 * Used for the Youjin Partner Plan page sharing functionality.
 */

import { forwardRef } from 'react';

interface PartnerPlanShareCardProps {
  className?: string;
}

const PartnerPlanShareCard = forwardRef<HTMLDivElement, PartnerPlanShareCardProps>(
  (_, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '360px',
          padding: '24px',
          backgroundColor: '#fff8f0',
          borderRadius: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Poster Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            color: '#ea580c',
            backgroundColor: '#fed7aa',
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
            background: 'linear-gradient(to right, #ea580c, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            有劲合伙人 · 让 AI 为你赚钱
          </h2>
          <p style={{ fontSize: '14px', color: '#78716c' }}>
            在 AI 大浪潮中，靠 AI 赚到第一桶金
          </p>
        </div>

        {/* Key Points */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1c1917' }}>
            ✔ 不需要技术、不需要流量、不需要拍视频
          </p>
          <p style={{ fontSize: '14px', color: '#57534e', marginBottom: '8px' }}>
            你只需要：<span style={{ fontWeight: '600', color: '#ea580c' }}>分享真实成长故事</span>
          </p>
          <p style={{ fontSize: '14px', color: '#57534e' }}>
            可推广：<span style={{ fontWeight: '600' }}>11款产品</span>覆盖情绪、财富、亲子三大场景
          </p>
        </div>

        {/* Income Preview */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '12px' }}>
            收益预测（30%转化率假设）
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#57534e' }}>💪 初级合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥2,169</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#57534e' }}>🔥 高级合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥18,158</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#57534e' }}>💎 钻石合伙人</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥66,544</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.4' }}>
            ⚠️ 收入预测仅供参考，实际收益因个人能力和市场变化而异，不构成收益承诺。
          </p>
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(to right, #f97316, #f59e0b)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
            扫码了解详情 或 访问有劲App
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#a8a29e' }}>
            有劲 · 让情绪成为力量
          </p>
        </div>
      </div>
    );
  }
);

PartnerPlanShareCard.displayName = 'PartnerPlanShareCard';

export default PartnerPlanShareCard;
