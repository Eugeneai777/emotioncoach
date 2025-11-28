import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ModuleGridCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  gradientStart: string;
  gradientEnd: string;
}

export const ModuleGridCard = ({
  icon: Icon,
  title,
  description,
  route,
  gradientStart,
  gradientEnd
}: ModuleGridCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 p-6 text-center group"
      onClick={() => navigate(route)}
    >
      {/* 渐变图标 */}
      <div 
        className="w-16 h-16 mx-auto rounded-xl mb-4 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
        }}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      {/* 渐变标题 */}
      <h3 
        className="text-lg font-bold mb-2"
        style={{
          background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
      >
        {title}
      </h3>
      
      {/* 描述 */}
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </Card>
  );
};
