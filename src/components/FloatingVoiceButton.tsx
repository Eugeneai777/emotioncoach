import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CoachVoiceChat } from '@/components/coach/CoachVoiceChat';

// 不显示浮动按钮的路由
const EXCLUDED_ROUTES = ['/auth', '/wechat-auth'];

const FloatingVoiceButton: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  // 检查是否在排除路由
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // 加载中或在排除路由时不显示
  if (loading || isExcludedRoute) {
    return null;
  }

  const handleClick = () => {
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

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={handleClick}
        className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-1 group"
        aria-label="有劲AI语音电话"
      >
        {/* 按钮主体 */}
        <div className="relative">
          {/* 脉冲动画背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-ping opacity-30" />
          
          {/* 按钮 */}
          <div className="relative w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 hover:scale-105 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/40">
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
