import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  route: string;
  gradient: string;
  stats?: {
    label: string;
    value: string;
  };
  index?: number;
}

export const ModuleCard = ({ 
  icon, 
  title, 
  description, 
  route, 
  gradient,
  stats,
  index = 0 
}: ModuleCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "group cursor-pointer bg-card/60 backdrop-blur-sm border-2 hover:border-transparent",
        "hover:-translate-y-1 transition-all duration-300 hover:shadow-xl rounded-xl overflow-hidden",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => navigate(route)}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
        gradient
      )} />
      
      <CardContent className="relative p-5">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-3xl",
          "bg-gradient-to-br shadow-md group-hover:scale-110 transition-transform duration-300",
          gradient
        )}>
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-1.5 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {description}
        </p>

        {/* Stats (optional) */}
        {stats && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <div className={cn(
              "px-2.5 py-1 rounded-full bg-gradient-to-r text-white font-medium",
              gradient
            )}>
              {stats.value}
            </div>
            <span className="text-muted-foreground">{stats.label}</span>
          </div>
        )}

        {/* Arrow */}
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span>进入模块</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};
