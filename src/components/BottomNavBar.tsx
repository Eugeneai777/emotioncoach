import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isCenter?: boolean;
}

export const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: <Home className="w-5 h-5" />, label: "首页", path: "/" },
    { icon: <Users className="w-5 h-5" />, label: "社区", path: "/community" },
    { icon: <span className="text-lg">🆘</span>, label: "情绪急救", path: "/emotion-button", isCenter: true },
    { icon: <Sparkles className="w-5 h-5" />, label: "工具", path: "/energy-studio" },
    { icon: <User className="w-5 h-5" />, label: "我的", path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 safe-area-bottom">
      <div className="flex items-end justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200",
              item.isCenter ? "relative -mt-4" : "flex-1 py-1"
            )}
          >
            {item.isCenter ? (
              // Center button - 情绪急救
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-500",
                    "shadow-lg shadow-teal-500/30",
                    "transition-transform duration-200",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] mt-1 text-teal-600 font-medium">
                  {item.label}
                </span>
              </div>
            ) : (
              // Regular nav items
              <>
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive(item.path)
                      ? "text-teal-600"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5",
                    isActive(item.path)
                      ? "text-teal-600 font-medium"
                      : "text-slate-400"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
