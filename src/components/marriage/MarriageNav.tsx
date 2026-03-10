import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardCheck, Bot, Briefcase, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/marriage", label: "首页", icon: Home },
  { path: "/marriage/assessments", label: "测评", icon: ClipboardCheck },
  { path: "/marriage/ai-tools", label: "AI工具", icon: Bot },
  { path: "/marriage/services", label: "服务", icon: Briefcase },
  { path: "/marriage/about", label: "关于", icon: Info },
  { path: "/marriage/help", label: "帮助", icon: MessageCircle },
];

export const MarriageNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-marriage-border safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px]",
                isActive
                  ? "text-marriage-primary"
                  : "text-muted-foreground hover:text-marriage-primary/70"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
