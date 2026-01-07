import React, { forwardRef, useEffect, useState } from 'react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import QRCode from 'qrcode';

interface WealthMilestoneShareCardProps {
  completedDays: number;
  totalDays: number;
  coreInsight?: string;
  shareUrl: string;
  avatarUrl?: string;
  displayName?: string;
}

const getMilestoneConfig = (days: number) => {
  if (days >= 21) {
    return {
      badge: '🏆',
      title: '完成挑战',
      subtitle: '21天财富觉醒之旅圆满结束',
      gradient: 'from-yellow-200 via-amber-200 to-yellow-300',
      accentColor: 'text-amber-800',
      bgColor: 'bg-amber-100',
    };
  }
  if (days >= 14) {
    return {
      badge: '🥈',
      title: '坚持14天',
      subtitle: '财富觉醒之旅已过半',
      gradient: 'from-slate-200 via-gray-200 to-slate-300',
      accentColor: 'text-slate-700',
      bgColor: 'bg-slate-100',
    };
  }
  if (days >= 7) {
    return {
      badge: '🥉',
      title: '坚持7天',
      subtitle: '第一周财富觉醒达成',
      gradient: 'from-orange-200 via-amber-100 to-orange-200',
      accentColor: 'text-orange-800',
      bgColor: 'bg-orange-100',
    };
  }
  return {
    badge: '✨',
    title: '觉醒进行中',
    subtitle: '每一天都在成长',
    gradient: 'from-violet-100 via-purple-100 to-violet-200',
    accentColor: 'text-violet-700',
    bgColor: 'bg-violet-50',
  };
};

const WealthMilestoneShareCard = forwardRef<HTMLDivElement, WealthMilestoneShareCardProps>(
  ({ completedDays, totalDays, coreInsight, shareUrl, avatarUrl, displayName = '财富觉醒者' }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const config = getMilestoneConfig(completedDays);
    const progress = Math.min((completedDays / totalDays) * 100, 100);

    useEffect(() => {
      const generateQR = async () => {
        try {
          const url = await QRCode.toDataURL(shareUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('Failed to generate QR code:', err);
        }
      };
      generateQR();
    }, [shareUrl]);

    return (
      <div
        ref={ref}
        className={`w-[320px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${config.gradient}`}
      >
        {/* Header with Avatar */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center border-2 border-white shadow-md`}>
                <Trophy className={`w-6 h-6 ${config.accentColor}`} />
              </div>
            )}
            <div>
              <p className={`${config.accentColor} font-bold text-base`}>{displayName}</p>
              <p className={`${config.accentColor} opacity-70 text-sm`}>{config.title}</p>
            </div>
          </div>
        </div>

        {/* Main Achievement Display */}
        <div className="bg-white/95 mx-3 rounded-xl p-5 shadow-inner text-center">
          {/* Badge */}
          <div className="text-5xl mb-3">{config.badge}</div>
          
          {/* Days Counter */}
          <div className="mb-3">
            <span className={`text-4xl font-bold ${config.accentColor}`}>{completedDays}</span>
            <span className={`text-lg ${config.accentColor} opacity-70`}> / {totalDays} 天</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Subtitle */}
          <p className={`text-sm ${config.accentColor} opacity-80`}>{config.subtitle}</p>

          {/* Core Insight (if available) */}
          {coreInsight && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className={`w-4 h-4 ${config.accentColor}`} />
                <span className={`text-xs ${config.accentColor} font-medium`}>核心洞察</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "{coreInsight.length > 50 ? coreInsight.slice(0, 50) + '...' : coreInsight}"
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex-1">
            <p className={`${config.accentColor} text-xs font-medium`}>扫码一起挑战</p>
            <p className={`${config.accentColor} text-sm font-bold`}>财富觉醒训练营</p>
          </div>
          {qrCodeUrl && (
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Brand Footer */}
        <div className={`${config.bgColor} px-5 py-2 text-center`}>
          <p className={`${config.accentColor} text-xs font-medium`}>有劲AI · 财富觉醒训练营</p>
        </div>
      </div>
    );
  }
);

WealthMilestoneShareCard.displayName = 'WealthMilestoneShareCard';

export default WealthMilestoneShareCard;
