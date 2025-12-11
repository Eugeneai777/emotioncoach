import React, { useState, useRef, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CoachVoiceChat } from '@/components/coach/CoachVoiceChat';

// 不显示浮动按钮的路由
const EXCLUDED_ROUTES = ['/auth', '/wechat-auth'];

const STORAGE_KEY = 'floating-voice-button-position';

interface Position {
  x: number;
  y: number;
}

const FloatingVoiceButton: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  
  // 拖拽相关状态
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragRef = useRef<HTMLButtonElement>(null);
  const dragStartPos = useRef<{ x: number; y: number; buttonX: number; buttonY: number } | null>(null);

  // 加载保存的位置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        // 验证位置是否在屏幕范围内
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 100;
        setPosition({
          x: Math.min(Math.max(16, pos.x), maxX),
          y: Math.min(Math.max(16, pos.y), maxY)
        });
      } catch {
        // 使用默认位置
      }
    }
  }, []);

  // 保存位置到localStorage
  const savePosition = (pos: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  };

  // 处理拖拽开始
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: clientX,
      y: clientY,
      buttonX: rect.left,
      buttonY: rect.top
    };
    setIsDragging(true);
    setHasMoved(false);
  };

  // 处理拖拽移动
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartPos.current) return;

    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    // 如果移动超过5px，标记为已移动（防止点击误触发拖拽）
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasMoved(true);
    }

    const newX = dragStartPos.current.buttonX + deltaX;
    const newY = dragStartPos.current.buttonY + deltaY;

    // 限制在屏幕范围内
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 100;

    setPosition({
      x: Math.min(Math.max(16, newX), maxX),
      y: Math.min(Math.max(16, newY), maxY)
    });
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    if (isDragging && position) {
      savePosition(position);
    }
    setIsDragging(false);
    dragStartPos.current = null;
  };

  // Mouse事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  // 全局事件监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position]);

  // 检查是否在排除路由
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // 加载中或在排除路由时不显示
  if (loading || isExcludedRoute) {
    return null;
  }

  const handleClick = () => {
    // 如果发生了拖拽，不触发点击
    if (hasMoved) return;
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可使用有劲AI语音电话",
      });
      navigate('/auth');
      return;
    }
    setShowVoiceChat(true);
  };

  // 计算样式
  const buttonStyle: React.CSSProperties = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        right: 16,
        bottom: 96,
      };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        ref={dragRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={`fixed z-50 flex flex-col items-center gap-1 group select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={buttonStyle}
        aria-label="有劲AI语音电话"
      >
        {/* 按钮主体 */}
        <div className="relative">
          {/* 脉冲动画背景 */}
          {!isDragging && (
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-ping opacity-30" />
          )}
          
          {/* 按钮 */}
          <div className={`relative w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 transition-all duration-200 ${
            isDragging ? 'scale-110 shadow-xl shadow-rose-500/50' : 'hover:scale-105 hover:shadow-xl hover:shadow-rose-500/40'
          }`}>
            <Phone className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* 文字标签 */}
        <span className="text-xs font-medium text-rose-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          有劲AI
        </span>
      </button>

      {/* 语音通话界面 */}
      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji="❤️"
          coachTitle="有劲AI语音电话"
          primaryColor="rose"
        />
      )}
    </>
  );
};

export default FloatingVoiceButton;
