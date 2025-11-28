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
        "hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl rounded-2xl overflow-hidden",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => navigate(route)}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
        gradient
      )} />
      
      <CardContent className="relative p-6">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-4xl",
          "bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300",
          gradient
        )}>
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>

        {/* Stats (optional) */}
        {stats && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <div className={cn(
              "px-3 py-1.5 rounded-full bg-gradient-to-r text-white font-medium",
              gradient
            )}>
              {stats.value}
            </div>
            <span className="text-muted-foreground">{stats.label}</span>
          </div>
        )}

        {/* Arrow */}
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>进入模块</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};
