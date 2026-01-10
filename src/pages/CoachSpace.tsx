import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { EnhancedCoachCard } from "@/components/coach/EnhancedCoachCard";
import { HumanCoachEntry } from "@/components/coach/HumanCoachEntry";

const CoachSpace = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-[env(safe-area-inset-bottom)]">
      {/* 极简顶部 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">教练空间</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach-space-intro')}>
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 欢迎语 */}
      <div className="px-4 py-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-800">✨ 选择你的专属教练</h2>
          <p className="text-slate-500 mt-1">开启今天的成长之旅</p>
        </motion.div>
      </div>

      {/* AI教练列表 - 单列 */}
      <section className="px-4 pb-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <span>🤖</span> AI 智能教练
        </h3>
        
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates?.map((coach, index) => (
              <EnhancedCoachCard key={coach.id} coach={coach} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* 真人教练入口 */}
      <section className="px-4 pb-8">
        <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <span>👩‍🏫</span> 真人教练
        </h3>
        <HumanCoachEntry />
      </section>
    </div>
  );
};

export default CoachSpace;
