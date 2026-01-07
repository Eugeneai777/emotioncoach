import React, { forwardRef, useEffect, useState } from 'react';
import { Sparkles, Brain, Heart } from 'lucide-react';
import QRCode from 'qrcode';

interface WealthJournalShareCardProps {
  dayNumber: number;
  meditationReflection?: string;
  behaviorBlock?: string;
  emotionNeed?: string;
  newBelief?: string;
  behaviorAwakening?: string;
  emotionAwakening?: string;
  beliefAwakening?: string;
  shareUrl: string;
  avatarUrl?: string;
  displayName?: string;
}

const WealthJournalShareCard = forwardRef<HTMLDivElement, WealthJournalShareCardProps>(
  ({ 
    dayNumber, 
    meditationReflection,
    behaviorBlock,
    emotionNeed,
    newBelief,
    behaviorAwakening,
    emotionAwakening,
    beliefAwakening,
    shareUrl,
    avatarUrl,
    displayName = '财富觉醒者'
  }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

    // Pick the best content to display (avoid duplication)
    const primaryAwakening = beliefAwakening || emotionAwakening || behaviorAwakening;
    
    // Check if new belief is already included in awakening to avoid repetition
    const showNewBelief = newBelief && (!primaryAwakening || !primaryAwakening.includes(newBelief));
    
    // Truncate text helper
    const truncate = (text: string | undefined, maxLen: number) => {
      if (!text) return '';
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    };

    return (
      <div
        ref={ref}
        className="w-[320px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #f59e0b 100%)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="avatar" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-600/30 flex items-center justify-center border-2 border-white shadow-md">
                <Sparkles className="w-5 h-5 text-amber-800" />
              </div>
            )}
            <div>
              <p className="text-amber-900 font-semibold text-sm">{displayName}</p>
              <p className="text-amber-700 text-xs">第{dayNumber}天打卡</p>
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-3">
            <h2 className="text-amber-900 font-bold text-lg">📖 今日觉醒</h2>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/90 mx-3 rounded-xl p-4 space-y-3">
          {/* Primary Awakening Moment */}
          {primaryAwakening && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">觉醒时刻</span>
              </div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">
                {truncate(primaryAwakening, 80)}
              </p>
            </div>
          )}

          {/* New Belief - only show if different from awakening */}
          {showNewBelief && (
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-violet-600 font-medium">新信念</span>
                <p className="text-sm text-gray-800">{truncate(newBelief, 50)}</p>
              </div>
            </div>
          )}

          {/* Emotion Need - only show if no awakening and no belief */}
          {emotionNeed && !primaryAwakening && !newBelief && (
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-pink-600 font-medium">情绪信号</span>
                <p className="text-sm text-gray-800">{truncate(emotionNeed, 50)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with QR */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-amber-900 text-xs font-medium">扫码加入</p>
            <p className="text-amber-800 text-sm font-bold">财富觉醒训练营</p>
          </div>
          {qrCodeUrl && (
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Brand */}
        <div className="bg-amber-700/20 px-5 py-2 text-center">
          <p className="text-amber-900 text-xs font-medium">有劲AI · 财富觉醒训练营</p>
        </div>
      </div>
    );
  }
);

WealthJournalShareCard.displayName = 'WealthJournalShareCard';

export default WealthJournalShareCard;
