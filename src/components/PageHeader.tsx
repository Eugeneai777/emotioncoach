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
  showLogo?: boolean;
}

const PageHeader = ({ 
  title, 
  showBack = true, 
  backTo, 
  rightActions,
  className = '',
  showHomeButton = false,
  showLogo = true
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const isHomePage = location.pathname === '/';
  
  return (
    <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 ${className}`}>
      <div className="flex items-center h-12 px-4 gap-1">
        {/* 左侧操作区 - 不可压缩 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 有劲AI Logo */}
          {showLogo && (
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
          )}

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
              size="sm"
              onClick={() => {
                sessionStorage.setItem('skip_preferred_redirect', '1');
                navigate('/mini-app');
              }}
              className="active:scale-95 transition-transform gap-1 px-2 text-xs whitespace-nowrap shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span>主页</span>
            </Button>
          )}
        </div>
        
        {/* 中间标题 - 可收缩截断 */}
        {title && (
          <div className="flex-1 min-w-0 pointer-events-none">
            <h1 className="font-semibold text-sm sm:text-lg truncate text-center">
              {title}
            </h1>
          </div>
        )}
        {/* 无标题时用 spacer 撑开 */}
        {!title && <div className="flex-1" />}
        
        {/* 右侧操作区 - 不可压缩 */}
        <div className="flex items-center gap-1 shrink-0">
          {rightActions}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
