import { useState, useCallback } from 'react';
import { Mic } from 'lucide-react';

interface ColorScheme {
  bg: string;
  border: string;
  glow: string;
}

interface PushToTalkButtonProps {
  primaryColor?: string;
  colors: ColorScheme;
  onStart: () => void;
  onStop: () => void;
}

export function PushToTalkButton({ colors, onStart, onStop }: PushToTalkButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setIsPressed(true);
    onStart();
  }, [onStart]);

  const handleUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isPressed) return;
    setIsPressed(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    onStop();
  }, [isPressed, onStop]);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-24 h-24 rounded-full ${colors.bg} flex items-center justify-center
          shadow-2xl ${colors.glow} ring-4 ring-white/15 transition-transform duration-150
          ${isPressed ? 'scale-110' : 'scale-100 active:scale-95'}`}
        style={{ touchAction: 'none' }}
      >
        {/* 录音中红色脉冲圈 */}
        {isPressed && (
          <>
            <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping" />
            <span className="absolute -inset-5 rounded-full bg-red-500/20 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        {/* 空闲呼吸光晕 */}
        {!isPressed && (
          <span className={`absolute -inset-2 rounded-full ${colors.bg} opacity-20 animate-pulse pointer-events-none`} />
        )}
        <Mic className={`w-10 h-10 ${isPressed ? 'text-white' : 'text-white/95'} relative z-10`} />
      </button>
      <p className={`text-sm font-medium ${isPressed ? 'text-red-300' : 'text-white/80'} drop-shadow`}>
        {isPressed ? '松开发送' : '按住说话'}
      </p>
    </div>
  );
}
