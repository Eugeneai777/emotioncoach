import QRCode from 'qrcode';
import { useState, useEffect } from 'react';

// 统一 QR 码配置常量
export const QR_CODE_CONFIG = {
  // 分享卡片标准尺寸
  SHARE_CARD: {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  },
  // 大尺寸（海报、通知设置等）
  LARGE: {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  }
} as const;

export type QRCodePreset = keyof typeof QR_CODE_CONFIG;

/**
 * 生成 QR 码 DataURL
 * @param url 要编码的 URL
 * @param preset 预设配置: 'SHARE_CARD' | 'LARGE'
 * @returns Promise<string> QR 码的 DataURL
 */
export async function generateQRCode(
  url: string,
  preset: QRCodePreset = 'SHARE_CARD'
): Promise<string> {
  const config = QR_CODE_CONFIG[preset];
  return QRCode.toDataURL(url, config);
}

/**
 * React Hook 用于生成 QR 码
 * @param url 要编码的 URL
 * @param preset 预设配置: 'SHARE_CARD' | 'LARGE'
 * @returns QR 码的 DataURL 或 null
 */
export function useQRCode(
  url: string | undefined | null,
  preset: QRCodePreset = 'SHARE_CARD'
): string | null {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setQrCodeUrl(null);
      return;
    }

    generateQRCode(url, preset)
      .then(setQrCodeUrl)
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        setQrCodeUrl(null);
      });
  }, [url, preset]);

  return qrCodeUrl;
}
