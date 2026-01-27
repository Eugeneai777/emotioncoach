import React, { forwardRef } from 'react';
import { Sparkles, Brain, Heart } from 'lucide-react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

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
  partnerCode?: string;
  onReady?: () => void;
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
    displayName = '财富觉醒者',
    partnerCode,
    onReady,
  }, ref) => {
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
      <ShareCardBase
        ref={ref}
        sharePath="/wealth-camp-intro"
        partnerCode={partnerCode}
        width={320}
        padding={0}
        borderRadius={16}
        background="linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #f59e0b 100%)"
        onReady={onReady}
        showFooter={false}
        renderFooter={(qrCodeUrl) => (
          <>
            {/* Footer with QR */}
            <div style={{ 
              padding: '16px 20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#78350f', margin: 0 }}>扫码加入</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#78350f', margin: 0 }}>财富觉醒训练营</p>
              </div>
              {qrCodeUrl && (
                <div style={{ 
                  background: 'white', 
                  padding: '6px', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                }}>
                  <img src={qrCodeUrl} alt="QR Code" style={{ width: '64px', height: '64px', display: 'block' }} />
                </div>
              )}
            </div>

            {/* Brand */}
            <div style={{ 
              background: 'rgba(180, 83, 9, 0.2)', 
              padding: '8px 20px', 
              textAlign: 'center' 
            }}>
              <p style={{ fontSize: '11px', fontWeight: '500', color: '#78350f', margin: 0 }}>
                Powered by 有劲AI
              </p>
            </div>
          </>
        )}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="avatar" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  objectFit: 'cover',
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'rgba(180, 83, 9, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <Sparkles style={{ width: '20px', height: '20px', color: '#78350f' }} />
              </div>
            )}
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#78350f', margin: 0 }}>{displayName}</p>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>第{dayNumber}天打卡</p>
            </div>
          </div>
          
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#78350f', margin: 0 }}>📖 今日觉醒</h2>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          background: 'rgba(255,255,255,0.9)', 
          margin: '0 12px', 
          borderRadius: '12px', 
          padding: '16px',
        }}>
          {/* Primary Awakening Moment */}
          {primaryAwakening && (
            <div style={{ 
              background: 'linear-gradient(to right, #fef3c7, #ffedd5)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #fde68a',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles style={{ width: '14px', height: '14px', color: '#d97706' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#b45309' }}>觉醒时刻</span>
              </div>
              <p style={{ fontSize: '14px', color: '#78350f', fontWeight: '500', lineHeight: 1.6, margin: 0 }}>
                {truncate(primaryAwakening, 80)}
              </p>
            </div>
          )}

          {/* New Belief - only show if different from awakening */}
          {showNewBelief && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
              <Brain style={{ width: '16px', height: '16px', color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500' }}>新信念</span>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{truncate(newBelief, 50)}</p>
              </div>
            </div>
          )}

          {/* Emotion Need - only show if no awakening and no belief */}
          {emotionNeed && !primaryAwakening && !newBelief && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Heart style={{ width: '16px', height: '16px', color: '#ec4899', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#db2777', fontWeight: '500' }}>情绪信号</span>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{truncate(emotionNeed, 50)}</p>
              </div>
            </div>
          )}
        </div>
      </ShareCardBase>
    );
  }
);

WealthJournalShareCard.displayName = 'WealthJournalShareCard';

export default WealthJournalShareCard;