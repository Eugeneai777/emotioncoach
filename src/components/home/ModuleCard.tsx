import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  color: string;
  stats?: {
    label: string;
    value: string;
  };
  index?: number;
}

export const ModuleCard = ({ 
  icon: Icon, 
  title, 
  description, 
  route, 
  color,
  stats,
  index = 0 
}: ModuleCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "group cursor-pointer bg-card hover:bg-card/80 backdrop-blur-sm border",
        "hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => navigate(route)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `hsl(var(--${color}))` }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Stats */}
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {stats.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.label}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>

        {/* Arrow */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          <span>进入模块</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};
