import React, { forwardRef, useEffect, useState } from 'react';
import { Sparkles, Brain, Heart, Target } from 'lucide-react';
import QRCode from 'qrcode';

interface WealthAwakeningShareCardProps {
  dayNumber: number;
  awakeningContent: string;
  awakeningType: 'behavior' | 'emotion' | 'belief';
  shareUrl: string;
  avatarUrl?: string;
  displayName?: string;
}

const typeConfig = {
  behavior: {
    label: '行为觉醒',
    icon: Target,
    gradient: 'from-amber-100 via-orange-100 to-amber-200',
    accentColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  emotion: {
    label: '情绪觉醒',
    icon: Heart,
    gradient: 'from-pink-100 via-rose-100 to-pink-200',
    accentColor: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
  },
  belief: {
    label: '信念觉醒',
    icon: Brain,
    gradient: 'from-violet-100 via-purple-100 to-violet-200',
    accentColor: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
  },
};

const WealthAwakeningShareCard = forwardRef<HTMLDivElement, WealthAwakeningShareCardProps>(
  ({ dayNumber, awakeningContent, awakeningType, shareUrl, avatarUrl, displayName = '财富觉醒者' }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const config = typeConfig[awakeningType];
    const TypeIcon = config.icon;

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

    const truncate = (text: string, maxLen: number) => {
      if (!text) return '';
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    };

    return (
      <div
        ref={ref}
        className={`w-[320px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${config.gradient}`}
      >
        {/* Header */}
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
                <Sparkles className={`w-6 h-6 ${config.accentColor}`} />
              </div>
            )}
            <div>
              <p className={`${config.accentColor} font-bold text-base`}>{displayName}</p>
              <p className={`${config.accentColor} opacity-70 text-sm`}>第{dayNumber}天觉醒</p>
            </div>
          </div>

          {/* Type Badge */}
          <div className="flex justify-center mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor} ${config.borderColor} border`}>
              <TypeIcon className={`w-4 h-4 ${config.accentColor}`} />
              <span className={`text-sm font-medium ${config.accentColor}`}>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Awakening Content */}
        <div className="bg-white/95 mx-3 rounded-xl p-5 shadow-inner">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className={`w-5 h-5 ${config.accentColor} shrink-0 mt-0.5`} />
            <span className={`text-sm font-medium ${config.accentColor}`}>觉醒时刻</span>
          </div>
          <p className="text-gray-800 text-base leading-relaxed font-medium pl-7">
            "{truncate(awakeningContent, 100)}"
          </p>
        </div>

        {/* CTA */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex-1">
            <p className={`${config.accentColor} text-xs font-medium`}>扫码一起觉醒</p>
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

WealthAwakeningShareCard.displayName = 'WealthAwakeningShareCard';

export default WealthAwakeningShareCard;
