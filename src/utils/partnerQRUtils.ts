// Unified partner QR code URL generation utility

const PRODUCTION_DOMAIN = 'https://wechat.eugenewe.net';

/**
 * Check if current environment is production
 */
export const isProductionEnv = (): boolean => {
  if (typeof window === 'undefined') return true;
  const host = window.location.host;
  return host === 'wechat.eugenewe.net' || !host.includes('lovable');
};

/**
 * Get the base domain for partner promotion URLs
 */
export const getPromotionDomain = (): string => {
  // 外部分享/二维码必须统一指向生产域名，避免在预览/多域名访问时导致微信分享不稳定或链接失效。
  // 注意：支付/OAuth 等内部回跳仍应使用 window.location.origin（不走这里）。
  return PRODUCTION_DOMAIN;
};

/**
 * Product types that partners can distribute
 */
export type PartnerProductType = 'trial_member' | 'wealth_assessment';

/**
 * Generate partner share URL based on entry type and product type
 * @param partnerId - Partner's UUID
 * @param entryType - 'free' (0 yuan) or 'paid' (9.9 yuan)
 * @param productType - 'trial_member' (尝鲜会员) or 'wealth_assessment' (财富测评)
 */
export const getPartnerShareUrl = (
  partnerId: string, 
  entryType: 'free' | 'paid',
  productType: PartnerProductType = 'trial_member'
): string => {
  const baseUrl = getPromotionDomain();
  
  if (productType === 'wealth_assessment') {
    // Wealth assessment: always goes to wealth-block page with partner tracking
    return `${baseUrl}/wealth-block?ref=${partnerId}`;
  }
  
  // Trial member product
  if (entryType === 'free') {
    // Free entry: claim directly
    return `${baseUrl}/claim?partner=${partnerId}`;
  } else {
    // Paid entry: redirect to payment page
    return `${baseUrl}/pay-entry?partner=${partnerId}`;
  }
};

/**
 * Get default share URL for non-partner users
 */
export const getDefaultShareUrl = (
  post?: {
    camp_type?: string;
    template_id?: string;
  }
): string => {
  const baseUrl = getPromotionDomain();
  
  if (post?.camp_type) {
    const campTypeMap: Record<string, string> = {
      'parent_emotion_21': '/parent-camp',
      'emotion_journal_21': '/camp-intro/emotion_journal_21',
      'emotion_bloom': '/camp-intro/emotion_bloom',
      'identity_bloom': '/camp-intro/identity_bloom',
      'wealth_block_7': '/wealth-camp-intro',
      'wealth_block_21': '/wealth-camp-intro'
    };
    if (campTypeMap[post.camp_type]) {
      return `${baseUrl}${campTypeMap[post.camp_type]}`;
    }
  }
  
  if (post?.template_id) {
    return `${baseUrl}/camp-template/${post.template_id}`;
  }
  
  return `${baseUrl}/introduction`;
};
