import { useState, useCallback, useRef, useEffect } from 'react';
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
  const activePointerIdRef = useRef<number | null>(null);

  const startPress = useCallback(() => {
    if (isPressedRef.current) return;
    isPressedRef.current = true;
    setIsPressed(true);
    onStart();
  }, [onStart]);

  const stopPress = useCallback(() => {
    if (!isPressedRef.current) return;
    isPressedRef.current = false;
    activePointerIdRef.current = null;
    setIsPressed(false);
    onStop();
  }, [onStop]);

  // 🛡️ 全局兜底：万一 setPointerCapture 在某些桌面浏览器失效，
  // 在 window 级别监听 pointerup/mouseup,确保松开必能停止录音,避免卡在录音态。
  useEffect(() => {
    if (!isPressed) return;
    const handler = () => stopPress();
    window.addEventListener('pointerup', handler);
    window.addEventListener('pointercancel', handler);
    window.addEventListener('mouseup', handler);
    window.addEventListener('blur', handler);
    return () => {
      window.removeEventListener('pointerup', handler);
      window.removeEventListener('pointercancel', handler);
      window.removeEventListener('mouseup', handler);
      window.removeEventListener('blur', handler);
    };
  }, [isPressed, stopPress]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // 仅响应主键（鼠标左键 / 触屏 / 笔）
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    activePointerIdRef.current = e.pointerId;
    // 🔒 锁定指针：鼠标移出按钮区域仍持续录音,松开 pointerup 仍在按钮上触发
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    startPress();
  }, [startPress]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    stopPress();
  }, [stopPress]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    stopPress();
  }, [stopPress]);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center
          shadow-2xl shadow-rose-900/50 ring-4 ring-white/10 transition-transform duration-150
          ${isPressed ? 'scale-110' : 'scale-100 active:scale-95'}`}
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        {/* 录音中红色脉冲圈 */}
        {isPressed && (
          <>
            <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
            <span className="absolute -inset-5 rounded-full bg-red-500/20 animate-ping [animation-delay:0.3s] pointer-events-none" />
          </>
        )}
        {/* 空闲呼吸光晕 */}
        {!isPressed && (
          <span className={`absolute -inset-2 rounded-full ${colors.bg} opacity-20 animate-pulse pointer-events-none`} />
        )}
        <Mic className={`w-10 h-10 ${isPressed ? 'text-white' : 'text-white/95'} relative z-10 pointer-events-none`} />
      </button>
      <p className={`text-sm font-medium ${isPressed ? 'text-red-300' : 'text-white/80'} drop-shadow`}>
        {isPressed ? '松开发送' : '按住说话'}
      </p>
    </div>
  );
}
