import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, BookOpen, Tent, Handshake, ShoppingBag } from "lucide-react";

const entries = [
  { label: "教练空间", icon: Compass, route: "/coach-space" },
  { label: "学习课程", icon: BookOpen, route: "/courses" },
  { label: "训练营", icon: Tent, route: "/camps" },
  { label: "合伙人", icon: Handshake, route: "/partner/type" },
  { label: "健康商城", icon: ShoppingBag, route: "/health-store" },
];

const QuickNavFooter = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-medium text-stone-400 px-0.5">更多服务</h3>
      <div className="grid grid-cols-5 gap-1.5">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <motion.button
              key={entry.label}
              onClick={() => navigate(entry.route)}
              className="group flex flex-col items-center gap-1 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <div className="w-10 h-10 rounded-xl bg-stone-800/40 ring-1 ring-stone-700/30 flex items-center justify-center
                              group-active:scale-90 transition-transform duration-200">
                <Icon className="w-4 h-4 text-stone-500" />
              </div>
              <span className="text-[9px] text-stone-600 leading-tight">{entry.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNavFooter;
