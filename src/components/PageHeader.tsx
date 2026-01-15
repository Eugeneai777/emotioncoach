import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  
  return (
    <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 ${className}`}>
      <div className="flex items-center justify-between h-12 px-4">
      <div className="flex items-center gap-1">
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
