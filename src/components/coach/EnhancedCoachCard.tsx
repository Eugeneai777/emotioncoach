import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useRecentCoaches } from "@/hooks/useRecentCoaches";

interface EnhancedCoachCardProps {
  coach: {
    id: string;
    coach_key: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    gradient: string | null;
    page_route: string;
    display_order: number;
  };
  index: number;
}

const emojiMap: Record<string, string> = {
  'emotion': '💚',
  'parent': '👪',
  'communication': '💬',
  'vibrant_life_sage': '❤️',
  'wealth_coach_4_questions': '💰',
  'story': '📖',
  'gratitude': '🙏',
};

const accentMap: Record<string, string> = {
  'emotion': 'bg-emerald-500',
  'parent': 'bg-pink-500',
  'communication': 'bg-blue-500',
  'vibrant_life_sage': 'bg-rose-500',
  'wealth_coach_4_questions': 'bg-amber-500',
  'story': 'bg-purple-500',
  'gratitude': 'bg-teal-500',
};

const glowMap: Record<string, string> = {
  'emotion': 'ring-emerald-200 bg-emerald-50',
  'parent': 'ring-pink-200 bg-pink-50',
  'communication': 'ring-blue-200 bg-blue-50',
  'vibrant_life_sage': 'ring-rose-200 bg-rose-50',
  'wealth_coach_4_questions': 'ring-amber-200 bg-amber-50',
  'story': 'ring-purple-200 bg-purple-50',
  'gratitude': 'ring-teal-200 bg-teal-50',
};

const getBadge = (coachKey: string, displayOrder: number): { label: string; style: string } | null => {
  if (coachKey === 'vibrant_life_sage' || coachKey === 'emotion')
    return { label: '推荐', style: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0' };
  if (coachKey === 'communication' || coachKey === 'story')
    return { label: '新', style: 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white border-0' };
  if (displayOrder <= 2)
    return { label: '推荐', style: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0' };
  return null;
};

export const EnhancedCoachCard = ({ coach, index }: EnhancedCoachCardProps) => {
  const navigate = useNavigate();
  const { recordVisit } = useRecentCoaches();
  const badge = getBadge(coach.coach_key, coach.display_order);
  const emoji = emojiMap[coach.coach_key] || '✨';
  const accent = accentMap[coach.coach_key] || 'bg-slate-500';
  const glow = glowMap[coach.coach_key] || 'ring-slate-200 bg-slate-50';

  const handleClick = () => {
    if (coach.page_route) {
      recordVisit({
        coach_key: coach.coach_key,
        title: coach.title,
        emoji,
        gradient: coach.gradient,
        page_route: coach.page_route,
      });
      navigate(coach.page_route);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 120, damping: 18 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="group relative flex bg-white rounded-2xl shadow-sm hover:shadow-lg 
                 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100
                 hover:border-slate-200"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* 左侧圆角色块 */}
      <div className={`w-1.5 ${accent} rounded-r-full flex-shrink-0 my-3`} />

      {/* 主内容区 */}
      <div className="flex items-center gap-3.5 p-4 flex-1 min-w-0">
        {/* Emoji 光晕区域 */}
        <div className={`w-14 h-14 rounded-2xl ring-2 ${glow} 
                        flex items-center justify-center flex-shrink-0 transition-transform duration-300
                        group-hover:scale-105`}>
          <span className="text-2xl">{emoji}</span>
        </div>

        {/* 文字区域 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[15px] text-slate-800 truncate">{coach.title}</h4>
            {badge && (
              <Badge className={`${badge.style} text-[10px] px-2 py-0.5 font-semibold rounded-full shadow-sm`}>
                {badge.label}
              </Badge>
            )}
          </div>

          {coach.subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{coach.subtitle}</p>
          )}

          {coach.description && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {coach.description}
            </p>
          )}
        </div>

        {/* 右侧箭头 */}
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 transition-all duration-300
                                  group-hover:text-slate-500 group-hover:translate-x-0.5" />
      </div>
    </motion.div>
  );
};
