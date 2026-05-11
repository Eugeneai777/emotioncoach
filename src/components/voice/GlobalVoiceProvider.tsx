import React, { createContext, useContext, useState, useCallback, ReactNode, Suspense, lazy } from 'react';
import { FloatingVoiceCard } from './FloatingVoiceCard';

const CoachVoiceChat = lazy(() =>
  import('@/components/coach/CoachVoiceChat').then((m) => ({ default: m.CoachVoiceChat }))
);

interface VoiceConfig {
  coachEmoji: string;
  coachTitle: string;
  primaryColor: string;
  tokenEndpoint: string;
  userId: string;
  mode: 'general' | 'parent_teen' | 'teen' | 'emotion';
  featureKey: string;
  voiceType: string;
  scenario?: string;
}

interface GlobalVoiceContextValue {
  isVoiceActive: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  startVoice: (config: VoiceConfig) => void;
  minimizeVoice: () => void;
  restoreVoice: () => void;
  endVoice: () => void;
  setVoiceConnected: () => void;
}

export const GlobalVoiceContext = createContext<GlobalVoiceContextValue | null>(null);

export function useGlobalVoice() {
  const ctx = useContext(GlobalVoiceContext);
  if (!ctx) throw new Error('useGlobalVoice must be used within GlobalVoiceProvider');
  return ctx;
}

export function GlobalVoiceProvider({ children }: { children: ReactNode }) {
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startVoice = useCallback((config: VoiceConfig) => {
    setVoiceConfig(config);
    setIsMinimized(true);
    setIsConnected(false);
    setStartTime(null);
  }, []);

  const setVoiceConnected = useCallback(() => {
    setIsConnected(true);
    setStartTime(Date.now());
  }, []);

  const minimizeVoice = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreVoice = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const endVoice = useCallback(() => {
    setVoiceConfig(null);
    setIsMinimized(false);
    setIsConnected(false);
    setStartTime(null);
  }, []);

  const isVoiceActive = !!voiceConfig;

  return (
    <GlobalVoiceContext.Provider
      value={{ isVoiceActive, isMinimized, isConnected, startVoice, minimizeVoice, restoreVoice, endVoice, setVoiceConnected }}
    >
      {children}

      {/* 语音通话全屏层 - 最小化时隐藏但不卸载，保持音频连接 */}
      {voiceConfig && (
        <div
          className={`fixed inset-0 z-[60] ${isMinimized ? 'pointer-events-none opacity-0 invisible' : ''}`}
          style={isMinimized ? { width: 0, height: 0, overflow: 'hidden' } : undefined}
        >
          {/* 最小化按钮 - 覆盖在 CoachVoiceChat 之上 */}
          {!isMinimized && (
            <button
              onClick={minimizeVoice}
              className="absolute top-4 left-4 z-[70] p-2 rounded-full bg-white/20 backdrop-blur-sm text-white active:scale-95 transition-transform"
              title="最小化"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <line x1="20" y1="4" x2="10" y2="14" />
              </svg>
            </button>
          )}

          <Suspense fallback={null}>
            <CoachVoiceChat
              onClose={endVoice}
              coachEmoji={voiceConfig.coachEmoji}
              coachTitle={voiceConfig.coachTitle}
              primaryColor={voiceConfig.primaryColor}
              tokenEndpoint={voiceConfig.tokenEndpoint}
              userId={voiceConfig.userId}
              mode={voiceConfig.mode}
              featureKey={voiceConfig.featureKey}
              voiceType={voiceConfig.voiceType}
            />
          </Suspense>
        </div>
      )}

      {/* 浮动小卡片 - 最小化时显示 */}
      {voiceConfig && isMinimized && (
        <FloatingVoiceCard
          coachEmoji={voiceConfig.coachEmoji}
          coachTitle={voiceConfig.coachTitle}
          startTime={startTime}
          isConnected={isConnected}
          onRestore={restoreVoice}
          onEnd={endVoice}
        />
      )}
    </GlobalVoiceContext.Provider>
  );
}
