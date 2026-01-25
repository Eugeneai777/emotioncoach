/**
 * One-Click Share Utility
 * 
 * Provides instant image generation and sharing with environment-specific handling.
 * Optimized for speed by working with pre-rendered card refs.
 */

import html2canvas from 'html2canvas';
import { getShareEnvironment } from './shareUtils';

export type CardType = 'camp' | 'value' | 'achievement' | 'fear' | 'blindspot' | 'transform';

/**
 * Background colors for each card type
 * Used to ensure proper display on platforms that don't support transparent PNGs
 */
export const CARD_BACKGROUND_COLORS: Record<CardType, string> = {
  // Purple/Indigo scheme - Assessment & Blindspot cards
  value: '#1e1b4b',      // Deep indigo (matches gradient start)
  blindspot: '#1e1b4b',  // Deep indigo (matches gradient start)
  
  // Red/Orange scheme - Fear/Emotional cards  
  fear: '#ef4444',       // Red (matches gradient start)
  
  // Orange/Amber scheme - Camp & Transform cards
  camp: '#f59e0b',       // Amber (matches gradient start)
  transform: '#f59e0b',  // Amber (matches gradient start)
  
  // Achievement card - Dark theme
  achievement: '#1a1a2e', // Dark purple-gray
};

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
 * Wait for all images in element to load
 */
const waitForImages = async (element: HTMLElement, timeout = 5000): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), timeout);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  });
  await Promise.all(promises);
};

/**
 * Generate canvas from a card element
 * @param cardRef - Reference to the card element
 * @param cardType - Optional card type for background color matching
 */
export const generateCardCanvas = async (
  cardRef: React.RefObject<HTMLDivElement>,
  cardType?: CardType
): Promise<HTMLCanvasElement | null> => {
  if (!cardRef.current) {
    console.error('[oneClickShare] cardRef.current is null');
    return null;
  }

  const originalElement = cardRef.current;
  
  // Get background color based on card type (null for transparent if not specified)
  const backgroundColor = cardType ? CARD_BACKGROUND_COLORS[cardType] : null;
  
  // Create hidden wrapper for rendering
  const wrapper = document.createElement('div');
  wrapper.id = 'one-click-share-wrapper';
  wrapper.style.cssText = `
    position: fixed !important;
    left: -99999px !important;
    top: -99999px !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: -99999 !important;
  `;

  // Clone and prepare element
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  clonedElement.style.transform = 'none';
  clonedElement.style.transformOrigin = 'top left';
  clonedElement.style.margin = '0';
  clonedElement.style.position = 'relative';
  clonedElement.style.width = originalElement.offsetWidth + 'px';
  clonedElement.style.minWidth = originalElement.offsetWidth + 'px';
  clonedElement.style.visibility = 'visible';
  clonedElement.style.opacity = '1';

  wrapper.appendChild(clonedElement);
  document.body.appendChild(wrapper);

  try {
    await waitForImages(clonedElement, 5000);
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await Promise.race([
      html2canvas(clonedElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: backgroundColor,
        logging: false,
        imageTimeout: 5000,
        removeContainer: false,
        foreignObjectRendering: false,
        onclone: (_doc, element) => {
          element.style.transform = 'none';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('图片生成超时')), 10000)
      )
    ]) as HTMLCanvasElement;

    return canvas;
  } finally {
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
};

/**
 * Convert canvas to blob
 */
export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
};

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
    const canvas = await generateCardCanvas(cardRef, cardType);
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
