import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Sparkles, Wind, Heart, Zap, Moon, BookOpen, Target } from "lucide-react";

interface ContextCardsProps {
  onToolSelect: (toolId: string) => void;
}

interface RecentTool {
  tool_id: string;
  used_at: string;
}

const toolMeta: Record<string, { label: string; emoji: string; icon: typeof Wind; gradient: string }> = {
  breathing: { label: "呼吸练习", emoji: "🌿", icon: Wind, gradient: "from-emerald-500/20 to-teal-500/15" },
  mindfulness: { label: "正念练习", emoji: "🧘", icon: Target, gradient: "from-violet-500/20 to-purple-500/15" },
  gratitude: { label: "感恩日记", emoji: "🌙", icon: Heart, gradient: "from-rose-500/20 to-pink-500/15" },
  energy: { label: "能量管理", emoji: "⚡", icon: Zap, gradient: "from-amber-500/20 to-yellow-500/15" },
  sleep: { label: "睡眠记录", emoji: "😴", icon: Moon, gradient: "from-indigo-500/20 to-blue-500/15" },
  declaration: { label: "能量宣言", emoji: "🌅", icon: Sparkles, gradient: "from-orange-500/20 to-amber-500/15" },
  values: { label: "价值观探索", emoji: "🧭", icon: Target, gradient: "from-cyan-500/20 to-teal-500/15" },
  strengths: { label: "优势发现", emoji: "💎", icon: Sparkles, gradient: "from-purple-500/20 to-violet-500/15" },
  habits: { label: "习惯追踪", emoji: "📊", icon: Target, gradient: "from-green-500/20 to-emerald-500/15" },
  "alive-check": { label: "存在确认", emoji: "💀", icon: Zap, gradient: "from-stone-500/20 to-stone-400/15" },
  vision: { label: "愿景板", emoji: "🎯", icon: Target, gradient: "from-sky-500/20 to-blue-500/15" },
  exercise: { label: "运动记录", emoji: "🏃", icon: Zap, gradient: "from-lime-500/20 to-green-500/15" },
  relationships: { label: "关系追踪", emoji: "🤝", icon: Heart, gradient: "from-pink-500/20 to-rose-500/15" },
};

interface DailyRec {
  toolId: string;
  label: string;
  tagline: string;
  emoji: string;
  icon: typeof Wind;
  gradient: string;
}

const getDailyRecommendations = (): DailyRec[] => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return [
      { toolId: "declaration", label: "能量宣言", tagline: "用一句话开启有劲的一天", emoji: "🌅", icon: Sparkles, gradient: "from-orange-500/20 to-amber-500/15" },
      { toolId: "breathing", label: "晨间呼吸", tagline: "3分钟深呼吸唤醒身体", emoji: "🌿", icon: Wind, gradient: "from-emerald-500/20 to-teal-500/15" },
    ];
  } else if (hour >= 12 && hour < 18) {
    return [
      { toolId: "mindfulness", label: "正念练习", tagline: "5分钟找回专注力", emoji: "🧘", icon: Target, gradient: "from-violet-500/20 to-purple-500/15" },
      { toolId: "energy", label: "能量管理", tagline: "记录此刻状态", emoji: "⚡", icon: Zap, gradient: "from-amber-500/20 to-yellow-500/15" },
    ];
  } else {
    return [
      { toolId: "gratitude", label: "感恩日记", tagline: "记录今天3件美好小事", emoji: "🌙", icon: Heart, gradient: "from-rose-500/20 to-pink-500/15" },
      { toolId: "sleep", label: "睡眠记录", tagline: "追踪睡眠改善休息", emoji: "😴", icon: Moon, gradient: "from-indigo-500/20 to-blue-500/15" },
    ];
  }
};

const ContextCards = ({ onToolSelect }: ContextCardsProps) => {
  const { user } = useAuth();

  const { data: recentTools } = useQuery({
    queryKey: ["recent-tools", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_tool_usage")
        .select("tool_id, used_at")
        .eq("user_id", user!.id)
        .order("used_at", { ascending: false })
        .limit(20);

      // Deduplicate by tool_id, keep most recent
      const seen = new Set<string>();
      const unique: RecentTool[] = [];
      for (const row of data || []) {
        if (!seen.has(row.tool_id) && toolMeta[row.tool_id]) {
          seen.add(row.tool_id);
          unique.push(row);
          if (unique.length >= 3) break;
        }
      }
      return unique;
    },
  });

  const dailyRecs = useMemo(() => getDailyRecommendations(), []);
  const hasRecent = recentTools && recentTools.length > 0;

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
    >
      {/* Recent tools */}
      {hasRecent && (
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs text-stone-500 font-medium">最近在用</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {recentTools.map((tool, i) => {
              const meta = toolMeta[tool.tool_id];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <motion.button
                  key={tool.tool_id}
                  onClick={() => onToolSelect(tool.tool_id)}
                  className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl
                             bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]
                             hover:bg-white/[0.07] active:scale-[0.97]
                             transition-all duration-200 touch-manipulation"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                    <span className="text-base">{meta.emoji}</span>
                  </div>
                  <span className="text-sm text-stone-300 font-medium whitespace-nowrap">{meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily recommendations */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500/70" />
          <span className="text-xs text-stone-500 font-medium">今日推荐</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {dailyRecs.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <motion.button
                key={rec.toolId}
                onClick={() => onToolSelect(rec.toolId)}
                className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left
                           bg-white/[0.04] backdrop-blur-sm border border-white/[0.06]
                           hover:bg-white/[0.07] active:scale-[0.97]
                           transition-all duration-200 touch-manipulation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.12, duration: 0.4 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rec.gradient} flex items-center justify-center`}>
                  <span className="text-lg">{rec.emoji}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-200">{rec.label}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{rec.tagline}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ContextCards;
