import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupportNavigationCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  route: string;
  reason?: string;
}

export const SupportNavigationCard = ({
  emoji,
  title,
  subtitle,
  route,
  reason
}: SupportNavigationCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(route);
  };

  return (
    <Card 
      className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
              <h4 className="font-medium text-sm text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {reason && (
                <p className="text-xs text-teal-600 mt-1">💡 {reason}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
