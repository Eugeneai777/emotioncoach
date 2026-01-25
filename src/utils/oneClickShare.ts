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
  CARD_BACKGROUND_COLORS,
  type CardBackgroundType 
} from './shareCardConfig';

export type CardType = 'camp' | 'value' | 'achievement' | 'fear' | 'blindspot' | 'transform';

// Map CardType to CardBackgroundType for compatibility
const cardTypeToBackgroundType: Record<CardType, CardBackgroundType> = {
  value: 'value',
  blindspot: 'blindspot',
  fear: 'fear',
  camp: 'camp',
  transform: 'transform',
  achievement: 'achievement',
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

    const blobUrl = URL.createObjectURL(blob);
    const file = new File([blob], `${cardName}.png`, { type: 'image/png' });

    // 1. Mini Program: Only image preview is supported
    if (env.isMiniProgram) {
      console.log('[oneClickShare] Mini Program - showing preview');
      onProgress?.('preview');
      onShowPreview?.(blobUrl);
      onSuccess?.();
      return true;
    }

    // 2. iOS (including WeChat H5): Prioritize native share
    if (env.isIOS && navigator.share && navigator.canShare?.({ files: [file] })) {
      console.log('[oneClickShare] iOS - trying navigator.share');
      try {
        onProgress?.('sharing');
        await navigator.share({
          files: [file],
          title: cardName,
          text: '邀请你一起突破财富卡点',
        });
        console.log('[oneClickShare] iOS share successful');
        onProgress?.('done');
        onSuccess?.();
        URL.revokeObjectURL(blobUrl);
        return true;
      } catch (shareError) {
        console.log('[oneClickShare] iOS share failed:', (shareError as Error).name);
        if ((shareError as Error).name === 'AbortError') {
          URL.revokeObjectURL(blobUrl);
          return false;
        }
        // Fall back to image preview
        console.log('[oneClickShare] Falling back to preview');
        onProgress?.('preview');
        onShowPreview?.(blobUrl);
        onSuccess?.();
        return true;
      }
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
        URL.revokeObjectURL(blobUrl);
        return true;
      } catch (shareError) {
        console.log('[oneClickShare] Android share failed:', (shareError as Error).name);
        if ((shareError as Error).name === 'AbortError') {
          URL.revokeObjectURL(blobUrl);
          return false;
        }
        // Fall back to image preview
        console.log('[oneClickShare] Falling back to preview');
        onProgress?.('preview');
        onShowPreview?.(blobUrl);
        onSuccess?.();
        return true;
      }
    }

    // 4. WeChat H5 without navigator.share support: Show image preview
    if (env.isWeChat) {
      console.log('[oneClickShare] WeChat H5 without share support - showing preview');
      onProgress?.('preview');
      onShowPreview?.(blobUrl);
      onSuccess?.();
      return true;
    }

    // 5. Desktop: Try Web Share, fallback to download
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        onProgress?.('sharing');
        await navigator.share({
          files: [file],
          title: cardName,
          text: '邀请你一起突破财富卡点',
        });
        onProgress?.('done');
        onSuccess?.();
        URL.revokeObjectURL(blobUrl);
        return true;
      } catch (shareError) {
        if ((shareError as Error).name === 'AbortError') {
          URL.revokeObjectURL(blobUrl);
          return false;
        }
      }
    }

    // 6. Final fallback: Download
    console.log('[oneClickShare] Falling back to download');
    const link = document.createElement('a');
    link.download = `${cardName}.png`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    
    onProgress?.('done');
    onSuccess?.();
    return true;

  } catch (error) {
    console.error('[oneClickShare] Unexpected error:', error);
    onProgress?.('error');
    onError?.(error instanceof Error ? error.message : '分享失败，请重试');
    return false;
  }
};
