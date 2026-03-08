import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BookOpen, BarChart3, Rocket, Mic } from "lucide-react";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";

interface SuperEntryProps {
  onInlineTool: (toolId: string) => void;
}

const paths = [
  {
    id: "emotion",
    icon: Phone,
    label: "不太舒服",
    route: "/emotion-button",
    color: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    route: "/awakening",
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    route: "/assessment-picker",
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    route: "/camps",
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting } = usePersonalizedGreeting();

  return (
    <motion.div
      className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30 border border-emerald-200/40 dark:border-emerald-800/30 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top section: greeting + voice button */}
      <div className="px-5 pt-6 pb-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
        <h2 className="text-lg font-bold text-foreground mb-5">
          你的AI生活教练，随时在线
        </h2>

        {/* Voice call button */}
        <button
          onClick={() => navigate("/coach/vibrant_life_sage")}
          className="relative group mx-auto block focus:outline-none touch-manipulation"
          aria-label="开始生活教练语音对话"
        >
          {/* Breathing glow */}
          <div className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 animate-pulse" />
          
          {/* Main button */}
          <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 
                          rounded-full flex flex-col items-center justify-center 
                          shadow-xl shadow-emerald-500/30
                          group-hover:scale-105 group-hover:shadow-emerald-500/40
                          group-active:scale-95 
                          transition-all duration-200 ease-out">
            <Mic className="w-8 h-8 text-white drop-shadow-md" />
            <span className="text-[10px] font-semibold text-white/90 mt-0.5">点击对话</span>
          </div>
        </button>

        <p className="text-xs text-muted-foreground mt-3">语音对话 · 什么都可以聊</p>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-emerald-200/30 dark:border-emerald-800/20" />

      {/* Bottom section: 4 quick paths as compact grid */}
      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground text-center mb-3">或者，选择你需要的</p>
        <div className="grid grid-cols-4 gap-2">
          {paths.map((path, i) => {
            const Icon = path.icon;
            return (
              <motion.button
                key={path.id}
                onClick={() => navigate(path.route)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 active:scale-95 transition-all"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.25 }}
              >
                <div className={`w-11 h-11 rounded-xl ${path.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${path.color}`} />
                </div>
                <span className={`text-[11px] font-medium ${path.color} text-center leading-tight`}>
                  {path.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default SuperEntry;
