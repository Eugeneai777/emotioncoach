import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ModuleBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  gradientStart: string;
  gradientEnd: string;
}

export const ModuleBanner = ({
  icon: Icon,
  title,
  description,
  route,
  gradientStart,
  gradientEnd,
}: ModuleBannerProps) => {
  const navigate = useNavigate();

  return (
    <Card className="relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
      {/* Left gradient decoration */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(180deg, hsl(${gradientStart}), hsl(${gradientEnd}))`
        }}
      />
      
      <div className="flex items-center justify-between p-6 pl-8">
        {/* Left content */}
        <div className="flex items-center gap-4 flex-1">
          <div 
            className="p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, hsl(${gradientStart}), hsl(${gradientEnd}))`
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 
              className="text-xl font-bold mb-1"
              style={{
                background: `linear-gradient(135deg, hsl(${gradientStart}), hsl(${gradientEnd}))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {/* Right button */}
        <Button 
          onClick={() => navigate(route)}
          className="ml-4"
          style={{
            background: `linear-gradient(135deg, hsl(${gradientStart}), hsl(${gradientEnd}))`
          }}
        >
          开始探索
        </Button>
      </div>
    </Card>
  );
};
