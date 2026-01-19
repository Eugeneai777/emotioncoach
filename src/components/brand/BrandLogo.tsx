import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-youjin-ai.png";

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export const BrandLogo = ({ 
  size = 'md', 
  showText = false, 
  textClassName,
  className 
}: BrandLogoProps) => {
  const dimension = sizeMap[size];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logoImage} 
        alt="有劲AI" 
        width={dimension} 
        height={dimension}
        className="rounded-full object-cover"
        style={{ 
          width: dimension, 
          height: dimension,
          minWidth: dimension,
          minHeight: dimension,
        }}
      />
      {showText && (
        <span className={cn(
          "font-medium text-amber-700",
          size === 'xs' && "text-xs",
          size === 'sm' && "text-sm",
          size === 'md' && "text-base",
          size === 'lg' && "text-lg",
          size === 'xl' && "text-xl",
          textClassName
        )}>
          有劲AI
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
