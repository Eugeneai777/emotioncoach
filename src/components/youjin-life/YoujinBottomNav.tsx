import { useNavigate } from "react-router-dom";
import { Home, MessageCircle } from "lucide-react";

const tabs = [
  { key: "home", label: "首页", icon: Home, path: "/youjin-life" },
  { key: "chat", label: "对话", icon: MessageCircle, path: "/youjin-life/chat" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function YoujinBottomNav({ active }: { active: TabKey }) {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-4 transition-colors ${
                isActive ? "text-gray-900" : "text-gray-400"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
