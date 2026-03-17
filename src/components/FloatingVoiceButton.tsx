import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone } from 'lucide-react';
// Force rebuild - Vite cache fix v3
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CoachVoiceChat } from '@/components/coach/CoachVoiceChat';
import { UnifiedPayDialog } from '@/components/UnifiedPayDialog';
import { PurchaseOnboardingDialog } from '@/components/onboarding/PurchaseOnboardingDialog';
import { supabase } from '@/integrations/supabase/client';
import { hasActiveSession, getActiveSession } from '@/hooks/useVoiceSessionLock';
import { preheatTokenEndpoint, prewarmMicrophoneStream, prewarmMicrophone } from '@/utils/RealtimeAudio';

// 不显示浮动按钮的路由（有劲AI页面有居中CTA，不需要浮动按钮）
const EXCLUDED_ROUTES = ['/auth', '/wechat-auth', '/coach/vibrant_life_sage', '/parent-coach', '/', '/mini-app', '/my-page'];

const POINTS_PER_MINUTE = 8;
const MEMBER_365_PACKAGE = {
  key: 'member365',
  name: '365会员',
  price: 365,
  quota: 1000
};

const STORAGE_KEY = 'floating-voice-button-position';

interface Position {
  x: number;
  y: number;
}

const FloatingVoiceButton: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  
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

  // 🚀 P0: 预热 Edge Function 和麦克风流
  const handlePreheat = useCallback(async () => {
    if (!user) return;
    
    // 并行预热 Edge Function 和麦克风流
    Promise.all([
      preheatTokenEndpoint('vibrant-life-realtime-token'),
      prewarmMicrophoneStream()
    ]).catch(console.warn);
  }, [user]);

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

  // 检查是否在排除路由（移到 hooks 之后）
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // 加载中或在排除路由时不显示
  if (loading || isExcludedRoute) {
    return null;
  }

  const handleClick = async () => {
    // 如果发生了拖拽，不触发点击
    if (hasMoved) return;
    
    // 🔧 检查全局语音会话锁 - 防止与其他语音组件冲突
    if (hasActiveSession()) {
      const session = getActiveSession();
      toast({
        title: "语音通话进行中",
        description: `已有语音会话在进行 (${session.component})，请先结束当前通话`,
      });
      return;
    }
    
    if (!user) {
      // 未登录时弹出购买引导对话框
      setShowPurchaseDialog(true);
      return;
    }

    // 检查余额
    setIsCheckingQuota(true);
    try {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', user.id)
        .single();

      if (!account || account.remaining_quota < POINTS_PER_MINUTE) {
        // 余额不足，先提示再弹出支付
        toast({
          title: "点数不足",
          description: `语音通话需要 ${POINTS_PER_MINUTE} 点/分钟，当前余额 ${account?.remaining_quota || 0} 点`,
        });
        setShowPayDialog(true);
        setIsCheckingQuota(false);
        return;
      }

      setIsCheckingQuota(false);
      setShowVoiceChat(true);
    } catch (error) {
      console.error('Check quota error:', error);
      setIsCheckingQuota(false);
      toast({
        title: "检查余额失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
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
        onMouseEnter={handlePreheat}
        onTouchStartCapture={handlePreheat}
        onClick={handleClick}
        className={`fixed z-50 flex flex-col items-center gap-1 group select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={buttonStyle}
        aria-label="有劲AI智能对话"
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
          coachTitle="有劲AI智能对话"
          primaryColor="rose"
        />
      )}

      {/* 额度不足时直接弹出365续费 */}
      <UnifiedPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={MEMBER_365_PACKAGE}
        onSuccess={() => {
          toast({
            title: "续费成功！",
            description: "现在可以开始智能对话了 🎉",
          });
          setShowPayDialog(false);
          setShowVoiceChat(true);
        }}
      />

      {/* 未登录时弹出购买引导 */}
      <PurchaseOnboardingDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        triggerFeature="有劲AI智能对话"
        onSuccess={() => {
          setShowPurchaseDialog(false);
          setShowVoiceChat(true);
        }}
      />
    </>
  );
};

export default FloatingVoiceButton;
