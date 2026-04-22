import { useState, useCallback, useRef } from 'react';
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
  const isPressedRef = useRef(false);

  const startPress = useCallback(() => {
    if (isPressedRef.current) return;
    isPressedRef.current = true;
    setIsPressed(true);
    onStart();
  }, [onStart]);

  const stopPress = useCallback(() => {
    if (!isPressedRef.current) return;
    isPressedRef.current = false;
    setIsPressed(false);
    onStop();
  }, [onStop]);

  const handleDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    startPress();
  }, [startPress]);

  const handleUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    stopPress();
  }, [stopPress]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startPress();
  }, [startPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    stopPress();
  }, [stopPress]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startPress();
  }, [startPress]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    stopPress();
  }, [stopPress]);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center
          shadow-2xl shadow-rose-900/50 ring-4 ring-white/10 transition-transform duration-150
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
