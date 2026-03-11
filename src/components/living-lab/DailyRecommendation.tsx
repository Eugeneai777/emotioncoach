import { useMemo } from "react";
import { Sparkles } from "lucide-react";

interface DailyRecommendationProps {
  onToolSelect: (toolId: string) => void;
}

interface Recommendation {
  toolId: string;
  name: string;
  emoji: string;
  tagline: string;
  cta: string;
}

const morningTools: Recommendation[] = [
  { toolId: "declaration", name: "能量宣言卡", emoji: "🌅", tagline: "用一句话开启有劲的一天", cta: "1分钟开始" },
  { toolId: "breathing", name: "晨间呼吸", emoji: "🌿", tagline: "3分钟深呼吸唤醒身体", cta: "1分钟开始" },
];

const afternoonTools: Recommendation[] = [
  { toolId: "mindfulness", name: "正念练习", emoji: "🧘", tagline: "午后5分钟，找回专注力", cta: "开始练习" },
  { toolId: "energy", name: "能量管理", emoji: "⚡", tagline: "记录此刻状态，优化下半天", cta: "快速记录" },
];

const eveningTools: Recommendation[] = [
  { toolId: "gratitude", name: "感恩日记", emoji: "🌙", tagline: "记录今天3件美好的小事", cta: "开始记录" },
  { toolId: "sleep", name: "睡眠记录", emoji: "😴", tagline: "追踪睡眠，改善休息质量", cta: "开始记录" },
];

const defaultTools: Recommendation[] = [
  { toolId: "alive-check", name: "每日平安打卡", emoji: "💗", tagline: "一个简单但温暖的安全确认", cta: "试一下" },
];

const DailyRecommendation = ({ onToolSelect }: DailyRecommendationProps) => {
  const recommendation = useMemo(() => {
    const hour = new Date().getHours();
    let pool: Recommendation[];
    if (hour >= 5 && hour < 12) pool = morningTools;
    else if (hour >= 12 && hour < 18) pool = afternoonTools;
    else pool = eveningTools;

    // Pick one based on day of year for consistency within a day
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return pool[dayOfYear % pool.length];
  }, []);

  return (
    <button
      onClick={() => onToolSelect(recommendation.toolId)}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
    >
      <span className="text-3xl">{recommendation.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] text-primary font-medium">今日推荐</span>
        </div>
        <p className="text-sm font-semibold text-foreground mt-0.5">{recommendation.name}</p>
        <p className="text-xs text-muted-foreground">{recommendation.tagline}</p>
      </div>
      <span className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
        {recommendation.cta}
      </span>
    </button>
  );
};

export default DailyRecommendation;
