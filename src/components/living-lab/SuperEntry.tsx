import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Phone, BookOpen, BarChart3, Rocket, Sparkles } from "lucide-react";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";

interface SuperEntryProps {
  onInlineTool: (toolId: string) => void;
}

const paths = [
  {
    id: "emotion",
    icon: Phone,
    label: "我现在不太舒服",
    sub: "AI教练语音陪你，说出来就好一些",
    route: "/emotion-coach",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200/60 dark:border-rose-800/40",
    accent: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "我想记录一下",
    sub: "写下觉察，看见自己的变化",
    route: "/awakening",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
    accent: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "我想看清自己",
    sub: "选一个测评，看见真实的自己",
    route: "/assessment-picker",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
    accent: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    id: "change",
    icon: Rocket,
    label: "我想真正改变",
    sub: "训练营系统陪你，一步步走出来",
    route: "/camps",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    accent: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting } = usePersonalizedGreeting();

  return (
    <div className="space-y-5">
      {/* Greeting + guiding question */}
      <div className="text-center space-y-1.5 pt-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h2 className="text-xl font-bold text-foreground">
          此刻，你想要什么？
        </h2>
      </div>

      {/* Life Coach Voice CTA */}
      <motion.button
        onClick={() => navigate("/coach/vibrant_life_sage")}
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-accent/90 p-5 text-left shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white">有劲生活教练</p>
            <p className="text-sm text-white/80 mt-0.5">语音对话，什么都可以聊</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
        </div>
      </motion.button>

      {/* 4 paths */}
      <div className="space-y-2.5">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border ${path.border} ${path.bg} hover:shadow-md active:scale-[0.98] transition-all text-left`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.06, duration: 0.3, ease: "easeOut" }}
            >
              <div className={`w-10 h-10 rounded-xl ${path.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${path.accent}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-semibold ${path.accent}`}>
                  {path.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {path.sub}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
