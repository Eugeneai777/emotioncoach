import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, BookOpen, Search, Rocket, ChevronRight } from "lucide-react";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { Skeleton } from "@/components/ui/skeleton";

interface SuperEntryProps {
  onInlineTool: (toolId: string) => void;
}

const paths = [
  {
    id: "emotion",
    emoji: "😔",
    label: "我现在不太舒服",
    sub: "有人陪你，说出来就好一些",
    icon: Heart,
    route: "/emotion-button",
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800/40",
  },
  {
    id: "record",
    emoji: "📝",
    label: "我想记录一下",
    sub: "写下来，是觉察的开始",
    icon: BookOpen,
    inline: true,
    toolIds: ["gratitude", "declaration"],
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    id: "assess",
    emoji: "🔍",
    label: "我想看清自己",
    sub: "专业测评，帮你看见真实的自己",
    icon: Search,
    inline: true,
    toolIds: ["midlife-awakening", "emotion-health", "scl90"],
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    id: "change",
    emoji: "🚀",
    label: "我想真正改变",
    sub: "AI教练陪你，一步步走出来",
    icon: Rocket,
    route: "/coach-space",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
];

const recordTools = [
  { id: "gratitude", label: "感恩日记", desc: "记录今天值得感恩的事" },
  { id: "declaration", label: "能量宣言", desc: "写下你对自己的承诺" },
];

const assessTools = [
  { id: "midlife-awakening", label: "中场觉醒力", desc: "看清你的人生阶段" },
  { id: "emotion-health", label: "情绪健康", desc: "了解你的情绪状态" },
  { id: "scl90", label: "心理健康筛查", desc: "全面的心理健康评估" },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const { greeting, isLoading } = usePersonalizedGreeting();

  const handleMainClick = () => {
    setIsExpanded(true);
  };

  const handlePathClick = (path: (typeof paths)[0]) => {
    if (path.route) {
      navigate(path.route);
      return;
    }
    if (path.inline) {
      setExpandedPath(expandedPath === path.id ? null : path.id);
    }
  };

  const handleSubToolClick = (toolId: string) => {
    onInlineTool(toolId);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Greeting */}
      <div className="text-center mb-8 animate-in fade-in-50 duration-700">
        {isLoading ? (
          <Skeleton className="h-7 w-48 mx-auto" />
        ) : (
          <p className="text-lg text-foreground/80">{greeting}</p>
        )}
      </div>

      {/* Main CTA Button */}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="main-btn"
            onClick={handleMainClick}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="开始有劲生活馆"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
          >
            {/* Glow */}
            <div className="absolute inset-[-28px] rounded-full animate-[glow_3s_ease-in-out_infinite] bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30" />
            {/* Breathing ring */}
            <div className="absolute inset-[-20px] bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse opacity-20" />
            <div
              className="absolute inset-[-10px] bg-gradient-to-r from-primary to-primary/70 rounded-full animate-ping opacity-15"
              style={{ animationDuration: "2s" }}
            />

            {/* Button */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-200 ease-out">
              <span className="text-primary-foreground font-bold text-xl sm:text-2xl tracking-wide drop-shadow-lg">
                我在，你说
              </span>
              <span className="text-primary-foreground/80 text-sm mt-2">
                点一下，我来陪你
              </span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="paths"
            className="w-full space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Collapse button */}
            <button
              onClick={() => {
                setIsExpanded(false);
                setExpandedPath(null);
              }}
              className="text-sm text-muted-foreground mb-2 flex items-center gap-1 hover:text-foreground transition-colors"
            >
              ← 返回
            </button>

            <p className="text-center text-foreground/70 text-sm mb-4">
              你现在想要什么？
            </p>

            {paths.map((path, i) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                <button
                  onClick={() => handlePathClick(path)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${path.border} ${path.bg} hover:shadow-md active:scale-[0.98] transition-all text-left`}
                >
                  <span className="text-2xl">{path.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-foreground">
                      {path.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {path.sub}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>

                {/* Inline sub-tools for "record" */}
                <AnimatePresence>
                  {expandedPath === "record" && path.id === "record" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-10 pt-2 space-y-2">
                        {recordTools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleSubToolClick(tool.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {tool.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tool.desc}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Inline sub-tools for "assess" */}
                  {expandedPath === "assess" && path.id === "assess" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-10 pt-2 space-y-2">
                        {assessTools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleSubToolClick(tool.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {tool.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tool.desc}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperEntry;
