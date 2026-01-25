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

  try {
    onProgress?.('generating');

    // Generate canvas with appropriate background color
    const canvas = await generateCanvas(cardRef, cardType);
    if (!canvas) {
      onProgress?.('error');
      onError?.('卡片生成失败，请重试');
      return false;
    }

    // Convert to blob
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      onProgress?.('error');
      onError?.('图片转换失败，请重试');
      return false;
    }

    const blobUrl = URL.createObjectURL(blob);

    // WeChat/iOS/MiniProgram: Show preview for long-press save
    if (env.isWeChat || env.isIOS || env.isMiniProgram) {
      onProgress?.('preview');
      onShowPreview?.(blobUrl);
      onSuccess?.();
      return true;
    }

    // Android/Desktop: Try Web Share API first
    const file = new File([blob], `${cardName}.png`, { type: 'image/png' });
    
    if (navigator.canShare?.({ files: [file] })) {
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
          // User cancelled - not an error
          URL.revokeObjectURL(blobUrl);
          return false;
        }
        // Fall through to download
      }
    }

    // Fallback: Download
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
    console.error('[oneClickShare] Error:', error);
    onProgress?.('error');
    onError?.(error instanceof Error ? error.message : '分享失败，请重试');
    return false;
  }
};
