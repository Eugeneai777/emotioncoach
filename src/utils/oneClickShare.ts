/**
 * One-Click Share Utility
 * 
 * Provides instant image generation and sharing with environment-specific handling.
 * Optimized for speed by working with pre-rendered card refs.
 */

import { getShareEnvironment } from './shareUtils';
import { 
  generateCanvas as generateCardCanvas, 
  canvasToBlob,
  getBlobFileExtension,
  CARD_BACKGROUND_COLORS,
  type CardBackgroundType 
} from './shareCardConfig';

export type CardType = 'camp' | 'value' | 'achievement' | 'fear' | 'blindspot' | 'transform' | 'promo';

// Map CardType to CardBackgroundType for compatibility
const cardTypeToBackgroundType: Record<CardType, CardBackgroundType> = {
  value: 'value',
  blindspot: 'blindspot',
  fear: 'fear',
  camp: 'camp',
  transform: 'transform',
  achievement: 'achievement',
  promo: 'camp',
};

// Re-export for backwards compatibility
export { CARD_BACKGROUND_COLORS };

export interface OneClickShareConfig {
  cardRef: React.RefObject<HTMLDivElement>;
  cardName?: string;
  cardType?: CardType;
  onProgress?: (status: 'generating' | 'sharing' | 'preview' | 'done' | 'error') => void;
  onShowPreview?: (blobUrl: string) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Generate canvas from a card element using the unified config
 * @param cardRef - Reference to the card element
 * @param cardType - Optional card type for background color matching
 */
export const generateCanvas = async (
  cardRef: React.RefObject<HTMLDivElement>,
  cardType?: CardType
): Promise<HTMLCanvasElement | null> => {
  const env = getShareEnvironment();
  const backgroundType = cardType ? cardTypeToBackgroundType[cardType] : 'transparent';
  
  return generateCardCanvas(cardRef, {
    backgroundType,
    isWeChat: env.isWeChat,
  });
};

export { canvasToBlob };

/**
 * Execute one-click share flow
 * 
 * - WeChat/iOS: Show image preview for long-press save
 * - Android/Desktop with Web Share API: Open native share sheet
 * - Fallback: Download the image
 */
export const executeOneClickShare = async (config: OneClickShareConfig): Promise<boolean> => {
  const { cardRef, cardName = '邀请卡片', cardType, onProgress, onShowPreview, onSuccess, onError } = config;
  const env = getShareEnvironment();

  console.log('[oneClickShare] Starting share flow:', { 
    cardType, 
    isWeChat: env.isWeChat, 
    isIOS: env.isIOS, 
    isMiniProgram: env.isMiniProgram,
    isAndroid: env.isAndroid 
  });

  try {
    onProgress?.('generating');

    // Check cardRef
    if (!cardRef.current) {
      console.error('[oneClickShare] cardRef.current is null');
      onProgress?.('error');
      onError?.('卡片未加载完成，请稍后重试');
      return false;
    }

    // Generate canvas with appropriate background color
    const canvas = await generateCanvas(cardRef, cardType);
    if (!canvas) {
      console.error('[oneClickShare] Canvas generation failed');
      onProgress?.('error');
      onError?.('卡片生成失败，请重试');
      return false;
    }

    // Convert to blob
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      console.error('[oneClickShare] Blob conversion failed');
      onProgress?.('error');
      onError?.('图片转换失败，请重试');
      return false;
    }

    console.log('[oneClickShare] Image generated successfully, blob size:', blob.size);

    const extension = getBlobFileExtension(blob);
    const file = new File([blob], `${cardName}.${extension}`, { type: blob.type || 'image/jpeg' });

    // Helper: upload blob and show preview with HTTPS URL
    const showUploadedPreview = async () => {
      const blobUrl = URL.createObjectURL(blob);
      onProgress?.('preview');
      onShowPreview?.(blobUrl);

      // 上传不阻塞预览，小程序/微信先看到图，再后台升级为 HTTPS 图
      (async () => {
      try {
        const { uploadShareImage } = await import('./shareImageUploader');
        const httpsUrl = await uploadShareImage(blob);
          onShowPreview?.(httpsUrl);
          URL.revokeObjectURL(blobUrl);
      } catch (uploadErr) {
          console.warn('[oneClickShare] Upload failed, keeping blob preview', uploadErr);
      }
      })();

      onSuccess?.();
      return true;
    };

    // 1. Mini Program: Only image preview is supported
    if (env.isMiniProgram) {
      console.log('[oneClickShare] Mini Program - showing preview');
      return showUploadedPreview();
    }

    // 2. WeChat H5: Skip unreliable navigator.share, show image preview
    if (env.isWeChat && !env.isMiniProgram) {
      console.log('[oneClickShare] WeChat H5 - showing preview (skip unreliable navigator.share)');
      return showUploadedPreview();
    }

    // 2. iOS: Skip unreliable navigator.share, show image preview
    if (env.isIOS) {
      console.log('[oneClickShare] iOS - showing preview (skip unreliable navigator.share)');
      return showUploadedPreview();
    }

    // 3. Android (including WeChat H5): Try native share
    if (env.isAndroid && navigator.share && navigator.canShare?.({ files: [file] })) {
      console.log('[oneClickShare] Android - trying navigator.share');
      try {
        onProgress?.('sharing');
        await navigator.share({
          files: [file],
          title: cardName,
          text: '邀请你一起突破财富卡点',
        });
        console.log('[oneClickShare] Android share successful');
        onProgress?.('done');
        onSuccess?.();
        return true;
      } catch (shareError) {
        console.log('[oneClickShare] Android share failed:', (shareError as Error).name);
        if ((shareError as Error).name === 'AbortError') {
          return false;
        }
        // Fall back to image preview
        console.log('[oneClickShare] Falling back to preview');
        return showUploadedPreview();
      }
    }

    // 4. WeChat H5 without navigator.share support: Show image preview
    if (env.isWeChat) {
      console.log('[oneClickShare] WeChat H5 without share support - showing preview');
      return showUploadedPreview();
    }

    // 5. Desktop & all other environments: show image preview
    // (download button + right-click save are handled inside ShareImagePreview)
    console.log('[oneClickShare] Desktop / fallback - showing preview');
    return showUploadedPreview();

  } catch (error) {
    console.error('[oneClickShare] Unexpected error:', error);
    onProgress?.('error');
    onError?.(error instanceof Error ? error.message : '分享失败，请重试');
    return false;
  }
};
