import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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

// Emoji映射
const emojiMap: Record<string, string> = {
  'emotion': '💚',
  'parent': '👪',
  'communication': '💬',
  'vibrant_life_sage': '❤️',
  'wealth_coach_4_questions': '💰',
  'story': '📖',
};

// 渐变色条映射（从gradient提取主色）
const sidebarGradientMap: Record<string, string> = {
  'emotion': 'from-emerald-400 to-teal-500',
  'parent': 'from-pink-400 to-rose-500',
  'communication': 'from-blue-400 to-indigo-500',
  'vibrant_life_sage': 'from-rose-400 to-red-500',
  'wealth_coach_4_questions': 'from-amber-400 to-orange-500',
  'story': 'from-purple-400 to-violet-500',
};

// Badge逻辑
const getBadge = (coachKey: string, displayOrder: number): string | null => {
  if (coachKey === 'vibrant_life_sage' || coachKey === 'emotion') return '推荐';
  if (coachKey === 'communication' || coachKey === 'story') return '新';
  if (displayOrder <= 2) return '推荐';
  return null;
};

export const EnhancedCoachCard = ({ coach, index }: EnhancedCoachCardProps) => {
  const navigate = useNavigate();
  const badge = getBadge(coach.coach_key, coach.display_order);
  const emoji = emojiMap[coach.coach_key] || '✨';
  const sidebarGradient = sidebarGradientMap[coach.coach_key] || 'from-slate-400 to-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => coach.page_route && navigate(coach.page_route)}
      className="relative flex bg-white rounded-xl shadow-sm hover:shadow-md 
                 transition-shadow duration-200 cursor-pointer overflow-hidden"
    >
      {/* 左侧主题色边条 */}
      <div className={`w-1 bg-gradient-to-b ${sidebarGradient} flex-shrink-0`} />
      
      {/* 主内容区 */}
      <div className="flex items-start gap-3 p-4 flex-1">
        {/* Emoji 区域 */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${coach.gradient || 'from-slate-100 to-slate-200'} 
                        flex items-center justify-center flex-shrink-0`}>
          <span className="text-3xl">{emoji}</span>
        </div>
        
        {/* 文字区域 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-slate-800">{coach.title}</h4>
            {badge && (
              <Badge className="bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0 font-medium border-amber-200">
                {badge}
              </Badge>
            )}
          </div>
          
          {coach.subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{coach.subtitle}</p>
          )}
          
          {coach.description && (
            <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              {coach.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
