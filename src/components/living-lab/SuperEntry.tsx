import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, BookOpen, BarChart3, Rocket, Heart, Brain, Users, Wallet } from "lucide-react";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";

interface SuperEntryProps {
  onInlineTool: (toolId: string) => void;
}

const assessments = [
  {
    id: "midlife-awakening",
    icon: Brain,
    label: "中场觉醒力",
    sub: "6维度看清你的人生卡点",
    route: "/midlife-awakening",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "emotion-health",
    icon: Heart,
    label: "情绪健康",
    sub: "了解你的情绪状态",
    route: "/emotion-health",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "comm-assessment",
    icon: Users,
    label: "沟通力评估",
    sub: "发现你的沟通模式",
    route: "/communication-assessment",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30",
  },
  {
    id: "wealth-block",
    icon: Wallet,
    label: "财富卡点",
    sub: "看见限制你的财富信念",
    route: "/wealth-block",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

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
    route: "/awakening-journal",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
    accent: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "我想看清自己",
    sub: "选一个测评，帮你看见真实的自己",
    expandable: true,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
    accent: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    id: "change",
    icon: Rocket,
    label: "我想真正改变",
    sub: "21天训练营，系统性陪你走出来",
    route: "/camp-intro/emotion_journal_21",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    accent: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting } = usePersonalizedGreeting();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePathClick = (path: (typeof paths)[0]) => {
    if (path.expandable) {
      setExpandedId(expandedId === path.id ? null : path.id);
      return;
    }
    if (path.route) {
      navigate(path.route);
    }
  };

  return (
    <div className="space-y-5">
      {/* Greeting + guiding question */}
      <div className="text-center space-y-1.5 pt-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h2 className="text-xl font-bold text-foreground">
          此刻，你想要什么？
        </h2>
      </div>

      {/* 4 paths */}
      <div className="space-y-2.5">
        {paths.map((path, i) => {
          const Icon = path.icon;
          const isExpanded = expandedId === path.id;

          return (
            <div key={path.id}>
              <motion.button
                onClick={() => handlePathClick(path)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border ${path.border} ${path.bg} hover:shadow-md active:scale-[0.98] transition-all text-left`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
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
                <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
              </motion.button>

              {/* Expandable assessment picker */}
              <AnimatePresence>
                {path.expandable && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pt-2 px-1">
                      {assessments.map((a, j) => {
                        const AIcon = a.icon;
                        return (
                          <motion.button
                            key={a.id}
                            onClick={() => navigate(a.route)}
                            className={`flex flex-col items-start gap-1.5 p-3 rounded-xl ${a.bg} border border-transparent hover:border-border/40 hover:shadow-sm active:scale-[0.97] transition-all text-left`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: j * 0.05, duration: 0.2 }}
                          >
                            <AIcon className={`w-4 h-4 ${a.color}`} />
                            <p className={`text-sm font-medium ${a.color}`}>{a.label}</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">{a.sub}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
