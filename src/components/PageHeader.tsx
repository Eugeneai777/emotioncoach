import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuickMenuConfig } from '@/hooks/useQuickMenuConfig';

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightActions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ 
  title, 
  showBack = true, 
  backTo, 
  rightActions,
  className = ''
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useQuickMenuConfig();
  
  // 读取用户配置的首页路径，与快捷菜单同步
  const homePath = config?.homePagePath ?? '/wealth-camp-checkin';
  
  // 在首页隐藏 Home 图标
  const isHomePage = location.pathname === homePath;
  
  return (
    <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 ${className}`}>
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-1">
          {/* Home 图标 - 固定在最左侧 */}
          {!isHomePage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(homePath)}
              className="text-amber-500 hover:bg-amber-100/50"
            >
              <Home className="w-5 h-5" />
            </Button>
          )}
          
          {/* 返回按钮 */}
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
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
