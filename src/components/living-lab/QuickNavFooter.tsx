import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, BookOpen, Tent, Handshake, ShoppingBag } from "lucide-react";

const entries = [
  { label: "教练空间", icon: Compass, route: "/coach-space", gradient: "from-cyan-500 to-blue-500" },
  { label: "学习课程", icon: BookOpen, route: "/courses", gradient: "from-amber-500 to-orange-500" },
  { label: "训练营", icon: Tent, route: "/camps", gradient: "from-violet-500 to-purple-500" },
  { label: "合伙人", icon: Handshake, route: "/partner/type", gradient: "from-pink-500 to-rose-500" },
  { label: "健康商城", icon: ShoppingBag, route: "/energy-studio", gradient: "from-emerald-500 to-teal-500" },
];

const QuickNavFooter = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">
        更多服务
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <motion.button
              key={entry.label}
              onClick={() => navigate(entry.route)}
              className="group flex flex-col items-center gap-1.5 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center
                              shadow-md group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{entry.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNavFooter;
