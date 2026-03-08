import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
    route: "/emotion-button",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200/60 dark:border-rose-800/40",
    accent: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "record",
    emoji: "📝",
    label: "我想记录一下",
    sub: "写下来，是觉察的开始",
    toolId: "gratitude",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "assess",
    emoji: "🔍",
    label: "我想看清自己",
    sub: "专业测评，帮你看见真实的自己",
    route: "/midlife-awakening",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "change",
    emoji: "🚀",
    label: "我想真正改变",
    sub: "AI教练陪你，一步步走出来",
    route: "/coach-space",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting, isLoading } = usePersonalizedGreeting();

  const handlePathClick = (path: (typeof paths)[0]) => {
    if (path.route) {
      navigate(path.route);
      return;
    }
    if (path.toolId) {
      onInlineTool(path.toolId);
    }
  };

  return (
    <div className="space-y-5">
      {/* Greeting + guiding question */}
      <div className="text-center space-y-2 pt-2">
        {isLoading ? (
          <Skeleton className="h-6 w-40 mx-auto" />
        ) : (
          <p className="text-base text-foreground/70">{greeting}</p>
        )}
        <h2 className="text-xl font-bold text-foreground">
          此刻，你想要什么？
        </h2>
      </div>

      {/* 4 paths - directly visible */}
      <div className="space-y-2.5">
        {paths.map((path, i) => (
          <motion.button
            key={path.id}
            onClick={() => handlePathClick(path)}
            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border ${path.border} ${path.bg} hover:shadow-md active:scale-[0.98] transition-all text-left`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
          >
            <span className="text-2xl shrink-0">{path.emoji}</span>
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
        ))}
      </div>
    </div>
  );
};

export default SuperEntry;
