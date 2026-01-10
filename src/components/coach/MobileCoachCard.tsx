import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface MobileCoachCardProps {
  coach: {
    id: string;
    coach_key: string;
    title: string;
    subtitle: string | null;
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

// Badge逻辑
const getBadge = (coachKey: string, displayOrder: number): string | null => {
  if (coachKey === 'vibrant_life_sage' || coachKey === 'emotion') return '推荐';
  if (coachKey === 'communication' || coachKey === 'story') return '新';
  if (displayOrder <= 2) return '推荐';
  return null;
};

export const MobileCoachCard = ({ coach, index }: MobileCoachCardProps) => {
  const navigate = useNavigate();
  const badge = getBadge(coach.coach_key, coach.display_order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => coach.page_route && navigate(coach.page_route)}
      className={`relative aspect-square rounded-2xl p-4 cursor-pointer
                  bg-gradient-to-br ${coach.gradient || 'from-slate-400 to-slate-500'} 
                  shadow-md hover:shadow-xl transition-shadow duration-300
                  flex flex-col items-center justify-center text-white
                  active:shadow-inner`}
    >
      {/* Badge */}
      {badge && (
        <Badge className="absolute top-2 right-2 bg-white/90 text-amber-600 text-[10px] px-1.5 py-0.5 font-medium">
          {badge}
        </Badge>
      )}

      {/* 大Emoji */}
      <motion.span 
        className="text-4xl mb-2"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.08 + 0.1, type: "spring", stiffness: 200 }}
      >
        {emojiMap[coach.coach_key] || '✨'}
      </motion.span>

      {/* 标题 */}
      <h4 className="font-bold text-base text-center drop-shadow-sm">{coach.title}</h4>
      {coach.subtitle && (
        <p className="text-xs text-white/80 mt-0.5 text-center line-clamp-1 px-2">
          {coach.subtitle}
        </p>
      )}
    </motion.div>
  );
};
