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
  isAndroid: boolean;
  isMiniProgram: boolean;
  supportsWebShare: boolean;
}

/**
 * Detect the current share environment
 */
export const getShareEnvironment = (): ShareEnvironment => {
  const ua = navigator.userAgent.toLowerCase();
  
  const isWeChat = ua.includes('micromessenger');
  const isMiniProgram = isWeChat && (
    ua.includes('miniprogram') || 
    (typeof window !== 'undefined' && (window as any).__wxjs_environment === 'miniprogram')
  );
  
  return {
    isWeChat,
    isIOS: /iphone|ipad|ipod/.test(ua),
    isMobile: /android|iphone|ipad|ipod/i.test(ua),
    isAndroid: /android/i.test(ua),
    isMiniProgram,
    supportsWebShare: !!(navigator.share && navigator.canShare),
  };
};

/**
 * Determine if image preview should be used instead of Web Share API
 * 
 * Returns true only for Mini Program environments where Web Share API is not available.
 * iOS (including WeChat H5) will use native navigator.share for system share panel.
 */
export const shouldUseImagePreview = (): boolean => {
  const { isMiniProgram } = getShareEnvironment();
  return isMiniProgram;
};

/**
 * Check if the environment is WeChat browser
 */
export const isWeChatBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

/**
 * Check if inside WeChat mini program
 */
export const isMiniProgramEnv = (): boolean => {
  const { isMiniProgram } = getShareEnvironment();
  return isMiniProgram;
};

/**
 * Get appropriate button text for share action based on environment
 */
export const getShareButtonText = (): string => {
  const { isMiniProgram } = getShareEnvironment();
  if (isMiniProgram) return '生成图片';
  return '分享';
};

/**
 * Get share button icon hint
 */
export const getShareButtonHint = (): string => {
  const { isMiniProgram } = getShareEnvironment();
  if (isMiniProgram) return '生成后长按保存';
  return '分享给好友';
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
  error?: string;
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
  const { isIOS, isMiniProgram, isAndroid } = getShareEnvironment();
  const file = new File([blob], filename, { type: 'image/png' });
  
  // Mini Program environment: Always use image preview (no Web Share API support)
  if (isMiniProgram) {
    const blobUrl = URL.createObjectURL(blob);
    options.onShowPreview?.(blobUrl);
    return { success: true, method: 'preview', blobUrl };
  }
  
  // iOS (including WeChat H5): Try native share first for system share panel
  if (isIOS && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.title || filename,
        text: options.text,
      });
      return { success: true, method: 'webshare' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'webshare', cancelled: true };
      }
      // Fall back to image preview if share fails
      const blobUrl = URL.createObjectURL(blob);
      options.onShowPreview?.(blobUrl);
      return { success: true, method: 'preview', blobUrl };
    }
  }
  
  // Android: Try Web Share API first
  if (isAndroid && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.title || filename,
        text: options.text,
      });
      return { success: true, method: 'webshare' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'webshare', cancelled: true };
      }
      // Fall through to preview on Android if share fails
      const blobUrl = URL.createObjectURL(blob);
      options.onShowPreview?.(blobUrl);
      return { success: true, method: 'preview', blobUrl };
    }
  }
  
  // Desktop or other: Try Web Share API
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.title || filename,
        text: options.text,
      });
      return { success: true, method: 'webshare' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'webshare', cancelled: true };
      }
      // Fall through to download
    }
  }
  
  // Fallback: Download the image
  try {
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
  } catch (error) {
    return { 
      success: false, 
      method: 'download', 
      error: (error as Error).message 
    };
  }
};
