// 分享卡片风格配置
export type CardStylePreset = 'default' | 'warm' | 'professional' | 'minimal';

export interface CardStyleConfig {
  id: CardStylePreset;
  label: string;
  gradient: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}

export const CARD_STYLE_CONFIGS: Record<CardStylePreset, CardStyleConfig> = {
  default: {
    id: 'default',
    label: '默认',
    gradient: 'from-amber-100 via-orange-100 to-amber-200',
    accentColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-800',
    mutedColor: 'text-amber-600',
  },
  warm: {
    id: 'warm',
    label: '温暖',
    gradient: 'from-rose-100 via-pink-100 to-rose-200',
    accentColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-800',
    mutedColor: 'text-rose-600',
  },
  professional: {
    id: 'professional',
    label: '专业',
    gradient: 'from-slate-100 via-gray-100 to-slate-200',
    accentColor: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-800',
    mutedColor: 'text-slate-600',
  },
  minimal: {
    id: 'minimal',
    label: '简约',
    gradient: 'from-white via-gray-50 to-white',
    accentColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    mutedColor: 'text-gray-500',
  },
};

// Inline style versions for html2canvas compatibility
export const CARD_STYLE_INLINE: Record<CardStylePreset, {
  background: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
}> = {
  default: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fef3c7 100%)',
    accentColor: '#b45309',
    textColor: '#92400e',
    mutedColor: '#d97706',
  },
  warm: {
    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #fce7f3 100%)',
    accentColor: '#be185d',
    textColor: '#9d174d',
    mutedColor: '#db2777',
  },
  professional: {
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
    accentColor: '#334155',
    textColor: '#1e293b',
    mutedColor: '#475569',
  },
  minimal: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #ffffff 100%)',
    accentColor: '#374151',
    textColor: '#1f2937',
    mutedColor: '#6b7280',
  },
};
