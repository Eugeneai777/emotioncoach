import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhoneOff } from 'lucide-react';

interface FloatingVoiceCardProps {
  coachEmoji: string;
  coachTitle: string;
  startTime: number | null;
  isConnected: boolean;
  onRestore: () => void;
  onEnd: () => void;
}

export function FloatingVoiceCard({ coachEmoji, coachTitle, startTime, isConnected, onRestore, onEnd }: FloatingVoiceCardProps) {
  const [position, setPosition] = useState({ x: 16, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const wasDragged = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 计时
  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // 拖动逻辑 - touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    dragRef.current = { startX: t.clientX, startY: t.clientY, origX: position.x, origY: position.y };
    wasDragged.current = false;
    setIsDragging(true);
  }, [position]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.startX;
    const dy = t.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragged.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 160, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 64, dragRef.current.origY + dy));
    setPosition({ x: newX, y: newY });
  }, []);

  const onTouchEnd = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // 拖动逻辑 - mouse
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragged.current = true;
      const newX = Math.max(0, Math.min(window.innerWidth - 160, dragRef.current.origX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 64, dragRef.current.origY + dy));
      setPosition({ x: newX, y: newY });
    };
    const onMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y };
    wasDragged.current = false;
    setIsDragging(true);
  }, [position]);

  const handleClick = useCallback(() => {
    if (!wasDragged.current) onRestore();
  }, [onRestore]);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onEnd();
  }, [onEnd]);

  return (
    <div
      ref={cardRef}
      className={`fixed z-[70] flex items-center gap-2 rounded-2xl px-3 py-2.5 shadow-xl border border-white/20 cursor-grab select-none
        bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl
        ${isDragging ? 'cursor-grabbing scale-105' : 'transition-shadow'}
      `}
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onClick={handleClick}
    >
      {/* 呼吸动画指示器 */}
      <div className="relative flex items-center justify-center w-9 h-9">
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-base shadow-inner">
          {coachEmoji}
        </div>
      </div>

      {/* 信息 */}
      <div className="flex flex-col min-w-0">
        <span className="text-white text-xs font-medium truncate max-w-[80px]">{coachTitle}</span>
        <span className="text-green-400 text-[10px] font-mono tabular-nums">{fmt(elapsed)}</span>
      </div>

      {/* 挂断按钮 */}
      <button
        onClick={handleEnd}
        onTouchEnd={(e) => { e.stopPropagation(); onEnd(); }}
        className="ml-1 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-red-500/30"
      >
        <PhoneOff className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}
