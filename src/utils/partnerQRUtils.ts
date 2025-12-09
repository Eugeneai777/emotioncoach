// Unified partner QR code URL generation utility

const PRODUCTION_DOMAIN = 'https://eugeneai.me';

/**
 * Check if current environment is production
 */
export const isProductionEnv = (): boolean => {
  if (typeof window === 'undefined') return true;
  const host = window.location.host;
  return host === 'eugeneai.me' || !host.includes('lovable');
};

/**
 * Get the base domain for partner promotion URLs
 */
export const getPromotionDomain = (): string => {
  if (isProductionEnv()) {
    return window.location.origin;
  }
  return PRODUCTION_DOMAIN;
};

/**
 * Generate partner share URL based on entry type
 * @param partnerId - Partner's UUID
 * @param entryType - 'free' (0 yuan) or 'paid' (9.9 yuan)
 */
export const getPartnerShareUrl = (
  partnerId: string, 
  entryType: 'free' | 'paid'
): string => {
  const baseUrl = getPromotionDomain();
  
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
      'identity_bloom': '/camp-intro/identity_bloom'
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
