import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo-youjin-ai.png';

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightActions?: React.ReactNode;
  className?: string;
  showHomeButton?: boolean;
}

const PageHeader = ({ 
  title, 
  showBack = true, 
  backTo, 
  rightActions,
  className = '',
  showHomeButton = false
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 智能返回逻辑：检测是否有历史记录
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 没有历史记录时返回首页
      navigate('/');
    }
  };

  // 判断是否在首页
  const isHomePage = location.pathname === '/';
  
  return (
    <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 ${className}`}>
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-1">
          {/* 有劲AI Logo */}
          <div
            onClick={() => !isHomePage && navigate('/')}
            className={`flex-shrink-0 ${isHomePage ? '' : 'cursor-pointer active:scale-95 transition-transform'}`}
          >
            <img
              src={logoImage}
              alt="有劲AI"
              className="w-9 h-9 md:w-12 md:h-12 rounded-full object-cover"
            />
          </div>

          {/* 返回按钮 */}
          {showBack && !isHomePage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* 返回首页按钮（可选） */}
          {showHomeButton && !isHomePage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="active:scale-95 transition-transform"
            >
              <Home className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* 标题 */}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-lg">
            {title}
          </h1>
        )}
        
        {/* 右侧操作区 */}
        <div className="flex items-center gap-1">
          {rightActions}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
