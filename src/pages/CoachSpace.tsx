import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { EnhancedCoachCard } from "@/components/coach/EnhancedCoachCard";
import { HumanCoachEntry } from "@/components/coach/HumanCoachEntry";
import { TeamCoachingEntry } from "@/components/coach/TeamCoachingEntry";
import PageHeader from "@/components/PageHeader";
import { CoachCardSkeleton, LoadingMessage } from "@/components/CoachCardSkeleton";
import { useRecentCoaches } from "@/hooks/useRecentCoaches";
import { useAuth } from "@/hooks/useAuth";

const getGreeting = (): { text: string; emoji: string } => {
  const h = new Date().getHours();
  if (h < 6) return { text: '夜深了，注意休息', emoji: '🌙' };
  if (h < 12) return { text: '早上好', emoji: '☀️' };
  if (h < 18) return { text: '下午好', emoji: '🌤️' };
  return { text: '晚上好', emoji: '🌆' };
};

// Emoji mapping for recent coaches display
const emojiMap: Record<string, string> = {
  'emotion': '💚',
  'parent': '👪',
  'communication': '💬',
  'vibrant_life_sage': '❤️',
  'wealth_coach_4_questions': '💰',
  'story': '📖',
  'gratitude': '🙏',
};

const CoachSpace = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();
  const { recentCoaches } = useRecentCoaches();
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="coachSpace" />
      <PageHeader
        title="教练空间"
        rightActions={
          <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
            <Bell className="w-5 h-5" />
          </Button>
        }
      />

      {/* 欢迎区 */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 p-5 text-white shadow-lg"
        >
          {/* 装饰圆 */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-lg" />

          <div className="relative z-10">
            <p className="text-lg font-bold">
              {greeting.emoji} {greeting.text}{user ? '，准备好成长了吗？' : ''}
            </p>
            <p className="text-white/80 text-sm mt-1">选择你的专属教练，开启今天的成长之旅</p>
          </div>
        </motion.div>
      </div>

      {/* 最近使用 */}
      {recentCoaches.length > 0 && (
        <section className="px-4 pt-3 pb-1">
          <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> 最近使用
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {recentCoaches.map((coach) => (
              <motion.button
                key={coach.coach_key}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(coach.page_route)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl border border-slate-100
                           shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                <span className="text-lg">{coach.emoji || emojiMap[coach.coach_key] || '✨'}</span>
                <span className="text-sm font-medium text-slate-700">{coach.title}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* AI教练列表 */}
      <section className="px-4 py-3">
        <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <span>🧭</span> AI 智能教练
        </h3>

        {isLoading ? (
          <>
            <LoadingMessage message="正在为您加载专属教练..." />
            <CoachCardSkeleton count={4} />
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates?.map((coach, index) => (
              <EnhancedCoachCard key={coach.id} coach={coach} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* 真人教练 */}
      <section className="px-4 pb-8">
        <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <span>👩‍🏫</span> 真人教练
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HumanCoachEntry />
          <TeamCoachingEntry />
        </div>
      </section>
    </div>
  );
};

export default CoachSpace;
