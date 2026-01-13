/**
 * Share utility functions for WeChat and iOS environments
 * 
 * WeChat's navigator.share() API is unreliable - it may resolve immediately
 * even when user hasn't completed the share. To provide a consistent UX,
 * we detect WeChat/iOS environments and use image preview + long-press-to-save
 * instead of the Web Share API.
 */

export interface ShareEnvironment {
  isWeChat: boolean;
  isIOS: boolean;
  isMobile: boolean;
  supportsWebShare: boolean;
}

/**
 * Detect the current share environment
 */
export const getShareEnvironment = (): ShareEnvironment => {
  const ua = navigator.userAgent.toLowerCase();
  
  return {
    isWeChat: ua.includes('micromessenger'),
    isIOS: /iphone|ipad|ipod/.test(ua),
    isMobile: /android|iphone|ipad|ipod/i.test(ua),
    supportsWebShare: !!(navigator.share && navigator.canShare),
  };
};

/**
 * Determine if image preview should be used instead of Web Share API
 * 
 * Returns true for:
 * - WeChat environments (unreliable Web Share API)
 * - iOS environments (for consistent long-press-to-save UX)
 */
export const shouldUseImagePreview = (): boolean => {
  const { isWeChat, isIOS } = getShareEnvironment();
  return isWeChat || isIOS;
};

/**
 * Check if the environment is WeChat browser
 */
export const isWeChatBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

/**
 * Get appropriate button text for share action based on environment
 */
export const getShareButtonText = (): string => {
  const { isWeChat } = getShareEnvironment();
  return isWeChat ? '生成图片' : '分享';
};

/**
 * Handle share with proper fallback for different environments
 * 
 * @param blob - The image blob to share
 * @param filename - The filename for the image
 * @param options - Share options
 * @returns Object containing the result and any blob URL created
 */
export interface ShareResult {
  success: boolean;
  method: 'webshare' | 'preview' | 'download';
  blobUrl?: string;
  cancelled?: boolean;
}

export interface ShareOptions {
  title?: string;
  text?: string;
  onShowPreview?: (blobUrl: string) => void;
  onDownload?: () => void;
}

export const handleShareWithFallback = async (
  blob: Blob,
  filename: string,
  options: ShareOptions = {}
): Promise<ShareResult> => {
  const { isWeChat, isIOS } = getShareEnvironment();
  const file = new File([blob], filename, { type: 'image/png' });
  
  // WeChat environment: Always use image preview (Web Share API is unreliable)
  if (isWeChat) {
    const blobUrl = URL.createObjectURL(blob);
    options.onShowPreview?.(blobUrl);
    return { success: true, method: 'preview', blobUrl };
  }
  
  // iOS non-WeChat: Also use image preview for consistent UX
  if (isIOS) {
    const blobUrl = URL.createObjectURL(blob);
    options.onShowPreview?.(blobUrl);
    return { success: true, method: 'preview', blobUrl };
  }
  
  // Try Web Share API for other environments
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.title || filename,
        text: options.text,
      });
      return { success: true, method: 'webshare' };
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'webshare', cancelled: true };
      }
      // Fall through to download
    }
  }
  
  // Fallback: Download the image
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = blobUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  
  options.onDownload?.();
  return { success: true, method: 'download' };
};
