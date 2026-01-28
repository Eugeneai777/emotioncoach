/**
 * Partner Share Card Styles Configuration
 * 
 * Defines 4 content-based templates for the partner plan share card:
 * - income: Revenue focused (default)
 * - products: Product matrix showcase
 * - easystart: Low barrier entry
 * - testimonial: Social proof with user stories
 */

export type PartnerCardContentTemplate = 'income' | 'products' | 'easystart' | 'testimonial';

export interface PartnerCardContentConfig {
  id: PartnerCardContentTemplate;
  label: string;
  description: string;
  emoji: string;
}

export const PARTNER_CARD_CONTENT_TEMPLATES: Record<PartnerCardContentTemplate, PartnerCardContentConfig> = {
  income: {
    id: 'income',
    label: '收益版',
    description: '突出净利润预测',
    emoji: '💰',
  },
  products: {
    id: 'products',
    label: '产品版',
    description: '11款产品矩阵',
    emoji: '📦',
  },
  easystart: {
    id: 'easystart',
    label: '入门版',
    description: '零门槛轻松开始',
    emoji: '🚀',
  },
  testimonial: {
    id: 'testimonial',
    label: '证言版',
    description: '真实案例故事',
    emoji: '💬',
  },
};

export const PARTNER_CARD_CONTENT_TEMPLATE_LIST = Object.values(PARTNER_CARD_CONTENT_TEMPLATES);

// Legacy color template type (kept for backward compatibility)
export type PartnerCardTemplate = 'classic' | 'professional' | 'minimal' | 'energetic';

export interface PartnerCardStyleConfig {
  id: PartnerCardTemplate;
  label: string;
  previewGradient: string;
  styles: {
    background: string;
    tagBg: string;
    tagText: string;
    titleGradient: string;
    subtitleColor: string;
    cardBg: string;
    cardShadow: string;
    accentColor: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    successColor: string;
    warningBg: string;
    warningText: string;
    ctaGradient: string;
    ctaText: string;
    footerText: string;
  };
}

export const PARTNER_CARD_STYLES: Record<PartnerCardTemplate, PartnerCardStyleConfig> = {
  classic: {
    id: 'classic',
    label: '经典橙',
    previewGradient: 'linear-gradient(to bottom right, #fb923c, #fbbf24)',
    styles: {
      background: '#fff8f0',
      tagBg: '#fed7aa',
      tagText: '#ea580c',
      titleGradient: 'linear-gradient(to right, #ea580c, #d97706)',
      subtitleColor: '#78716c',
      cardBg: '#ffffff',
      cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
      accentColor: '#ea580c',
      textPrimary: '#1c1917',
      textSecondary: '#57534e',
      textMuted: '#78716c',
      successColor: '#16a34a',
      warningBg: '#fef3c7',
      warningText: '#92400e',
      ctaGradient: 'linear-gradient(to right, #f97316, #f59e0b)',
      ctaText: '#ffffff',
      footerText: '#a8a29e',
    },
  },
  professional: {
    id: 'professional',
    label: '专业蓝',
    previewGradient: 'linear-gradient(to bottom right, #64748b, #2563eb)',
    styles: {
      background: '#f8fafc',
      tagBg: '#dbeafe',
      tagText: '#1d4ed8',
      titleGradient: 'linear-gradient(to right, #1e40af, #3b82f6)',
      subtitleColor: '#64748b',
      cardBg: '#ffffff',
      cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
      accentColor: '#2563eb',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
      successColor: '#059669',
      warningBg: '#f1f5f9',
      warningText: '#475569',
      ctaGradient: 'linear-gradient(to right, #1e40af, #3b82f6)',
      ctaText: '#ffffff',
      footerText: '#94a3b8',
    },
  },
  minimal: {
    id: 'minimal',
    label: '极简白',
    previewGradient: 'linear-gradient(to bottom right, #f3f4f6, #ffffff)',
    styles: {
      background: '#ffffff',
      tagBg: '#f4f4f5',
      tagText: '#18181b',
      titleGradient: 'linear-gradient(to right, #18181b, #3f3f46)',
      subtitleColor: '#71717a',
      cardBg: '#fafafa',
      cardShadow: '0 1px 2px rgba(0,0,0,0.05)',
      accentColor: '#18181b',
      textPrimary: '#09090b',
      textSecondary: '#3f3f46',
      textMuted: '#71717a',
      successColor: '#18181b',
      warningBg: '#f4f4f5',
      warningText: '#52525b',
      ctaGradient: 'linear-gradient(to right, #18181b, #3f3f46)',
      ctaText: '#ffffff',
      footerText: '#a1a1aa',
    },
  },
  energetic: {
    id: 'energetic',
    label: '活力紫',
    previewGradient: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
    styles: {
      background: '#fdf4ff',
      tagBg: '#f3e8ff',
      tagText: '#9333ea',
      titleGradient: 'linear-gradient(to right, #9333ea, #db2777)',
      subtitleColor: '#a1a1aa',
      cardBg: '#ffffff',
      cardShadow: '0 1px 3px rgba(147,51,234,0.1)',
      accentColor: '#a855f7',
      textPrimary: '#1e1b4b',
      textSecondary: '#4c1d95',
      textMuted: '#7c3aed',
      successColor: '#10b981',
      warningBg: '#fef3c7',
      warningText: '#92400e',
      ctaGradient: 'linear-gradient(to right, #9333ea, #db2777)',
      ctaText: '#ffffff',
      footerText: '#c4b5fd',
    },
  },
};

export const PARTNER_CARD_TEMPLATE_LIST = Object.values(PARTNER_CARD_STYLES);
