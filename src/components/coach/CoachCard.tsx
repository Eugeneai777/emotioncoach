import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CoachCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  route: string | null;
  badge?: string | null;
  disabled?: boolean;
}

export const CoachCard = ({
  title,
  subtitle,
  description,
  icon,
  gradient,
  route,
  badge,
  disabled = false,
}: CoachCardProps) => {
  const navigate = useNavigate();
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon;

  const handleClick = () => {
    if (!disabled && route) {
      navigate(route);
    }
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-300",
        !disabled && "cursor-pointer hover:shadow-xl hover:-translate-y-1",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon with gradient background */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-gradient-to-br transition-transform duration-300",
              !disabled && "group-hover:scale-110",
              gradient
            )}
          >
            {IconComponent && (
              <IconComponent className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-lg leading-tight">{title}</h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {badge && (
                <Badge
                  variant={badge === "推荐" ? "default" : "secondary"}
                  className="flex-shrink-0"
                >
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
