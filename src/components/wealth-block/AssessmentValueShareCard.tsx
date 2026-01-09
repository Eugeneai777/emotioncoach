import React, { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface AssessmentValueShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  healthScore?: number;
  reactionPattern?: string;
}

const AssessmentValueShareCard = forwardRef<HTMLDivElement, AssessmentValueShareCardProps>(
  ({ className, avatarUrl, displayName, partnerInfo, healthScore = 68, reactionPattern = '追逐型' }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    // Generate shareable URL with partner tracking
    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-block`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };

    useEffect(() => {
      const generateQR = async () => {
        try {
          const url = await QRCode.toDataURL(getShareUrl(), {
            width: 100,
            margin: 1,
            color: {
              dark: '#1e1b4b',
              light: '#ffffff',
            },
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR code generation failed:', err);
        }
      };
      generateQR();
    }, [partnerInfo]);

    // Value propositions
    const valuePoints = [
      { emoji: '🎯', text: '30个真实财富场景深度测评' },
      { emoji: '🤖', text: 'AI智能分析行为/情绪/信念三层' },
      { emoji: '💡', text: '专属突破路径与行动建议' },
    ];

    // Get score color
    const getScoreColor = (score: number): string => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    return (
      <div 
        ref={ref} 
        className={`w-[320px] rounded-2xl overflow-hidden shadow-2xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        }}
      >
        {/* Header with user info */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400/50">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {displayName?.[0] || '财'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium">
                {displayName || '财富探索者'}
              </p>
              <p className="text-amber-300/80 text-xs">
                刚完成了AI财富心理测评 ✨
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-white font-bold text-xl mb-1">
              财富卡点测评
            </h2>
            <p className="text-violet-200/70 text-xs">
              Powered by 有劲AI · 财富教练
            </p>
          </div>

          {/* Mini Score Preview */}
          <div className="bg-white/10 rounded-xl p-4 mb-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">我的觉醒指数</p>
                <div className="flex items-baseline gap-1">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: getScoreColor(healthScore) }}
                  >
                    {healthScore}
                  </span>
                  <span className="text-white/40 text-sm">/100</span>
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-white/60 text-xs mb-1">反应模式</p>
                <span className="inline-block px-3 py-1 bg-amber-500/30 rounded-full text-amber-300 text-sm font-medium">
                  {reactionPattern}
                </span>
              </div>
            </div>
          </div>

          {/* Value Points */}
          <div className="space-y-3 mb-5">
            <p className="text-white/80 text-xs font-medium mb-2">🎁 测评包含</p>
            {valuePoints.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-lg">{point.emoji}</span>
                <span className="text-white/90 text-sm">{point.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Section with QR */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-medium text-sm mb-1">
                  扫码体验专属你的
                </p>
                <p className="text-amber-300 font-bold text-base">
                  财富心理诊断
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-amber-400 font-bold text-xl">¥9.9</span>
                  <span className="text-white/40 text-xs line-through">¥49</span>
                  <span className="text-amber-300/70 text-xs">限时体验价</span>
                </div>
              </div>
              {qrCodeUrl && (
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white p-1.5">
                  <img src={qrCodeUrl} alt="二维码" className="w-full h-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/30 px-5 py-3">
          <p className="text-center text-violet-200/50 text-xs">
            有劲AI · 让财富自由从认识自己开始
          </p>
        </div>
      </div>
    );
  }
);

AssessmentValueShareCard.displayName = 'AssessmentValueShareCard';

export default AssessmentValueShareCard;
