/**
 * Server-side share card generation utility.
 * Calls the edge function to generate SVG, then converts to PNG on the client.
 * This bypasses html2canvas entirely, fixing iOS/WeChat rendering issues.
 */

import { supabase } from '@/integrations/supabase/client';

export interface WealthCardData {
  healthScore: number;
  reactionPattern: string;
  displayName?: string;
  avatarUrl?: string;
  partnerCode?: string;
  dominantPoor?: string;
}

/**
 * Generate a share card image blob via server-side rendering.
 * Returns a PNG Blob ready for saving/sharing.
 */
export async function generateServerShareCard(data: WealthCardData): Promise<Blob | null> {
  try {
    // 1. Call edge function to get SVG
    const { data: svgData, error } = await supabase.functions.invoke('generate-share-card', {
      body: { cardType: 'wealth-assessment', data },
    });

    if (error) {
      console.error('[serverShareCard] Edge function error:', error);
      return null;
    }

    // The response is SVG text
    const svgString = typeof svgData === 'string' ? svgData : await svgData.text?.() || String(svgData);

    if (!svgString || svgString.startsWith('{')) {
      console.error('[serverShareCard] Invalid SVG response:', svgString?.substring(0, 100));
      return null;
    }

    // 2. Convert SVG to PNG via canvas (native browser API, very reliable)
    return await svgToPngBlob(svgString, 340, 2);
  } catch (e) {
    console.error('[serverShareCard] Generation failed:', e);
    return null;
  }
}

/**
 * Convert SVG string to PNG Blob using canvas.
 * This uses native browser APIs (no html2canvas) and works reliably on iOS/WeChat.
 */
function svgToPngBlob(svgString: string, width: number, scale: number = 2): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/png',
          1.0
        );
      } catch (e) {
        console.error('[serverShareCard] Canvas conversion failed:', e);
        resolve(null);
      }
    };

    img.onerror = (e) => {
      console.error('[serverShareCard] SVG image load failed:', e);
      resolve(null);
    };

    // Load SVG as data URL
    const encoded = encodeURIComponent(svgString);
    img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
  });
}

/**
 * Generate server share card and return as data URL (for preview).
 */
export async function generateServerShareCardDataUrl(data: WealthCardData): Promise<string | null> {
  const blob = await generateServerShareCard(data);
  if (!blob) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
