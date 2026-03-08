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
    sub: "即刻陪伴",
    route: "/emotion-button",
    gradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/25",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    gradient: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/25",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/25",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting } = usePersonalizedGreeting();

  return (
    <div className="space-y-6">
      {/* Hero: Voice Coach CTA */}
      <motion.div
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 pb-5"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-teal-300/15 blur-xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-emerald-100 text-sm mb-1">{greeting}</p>
          <h2 className="text-white text-xl font-bold mb-6 tracking-tight">
            你的AI生活教练
          </h2>

          {/* Pulsing voice button */}
          <button
            onClick={() => navigate("/coach/vibrant_life_sage")}
            className="relative group focus:outline-none touch-manipulation mb-4"
            aria-label="开始语音对话"
          >
            {/* Outer ring pulse */}
            <div className="absolute inset-[-16px] rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-white/30 animate-pulse" />
            
            {/* Button */}
            <div className="relative w-[88px] h-[88px] bg-white rounded-full flex flex-col items-center justify-center
                            shadow-2xl shadow-black/20
                            group-hover:scale-110 group-active:scale-95
                            transition-transform duration-200 ease-out">
              <Mic className="w-8 h-8 text-emerald-600 mb-0.5" />
              <span className="text-[10px] font-bold text-emerald-700">点击对话</span>
            </div>
          </button>

          <p className="text-white/70 text-xs">语音 · 文字 · 什么都可以聊</p>
        </div>
      </motion.div>

      {/* 4 Quick Paths */}
      <div className="grid grid-cols-4 gap-3">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className="group flex flex-col items-center gap-2 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${path.gradient} flex items-center justify-center
                              shadow-lg ${path.glow}
                              group-hover:scale-110 group-hover:shadow-xl group-active:scale-95
                              transition-all duration-200 ease-out`}>
                <Icon className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground leading-tight">{path.label}</p>
                <p className="text-[10px] text-muted-foreground">{path.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
