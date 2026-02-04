import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Bell, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { EnhancedCoachCard } from "@/components/coach/EnhancedCoachCard";
import { HumanCoachEntry } from "@/components/coach/HumanCoachEntry";
import { TeamCoachingEntry } from "@/components/coach/TeamCoachingEntry";
import PageHeader from "@/components/PageHeader";
import { CoachCardSkeleton, LoadingMessage } from "@/components/CoachCardSkeleton";
import { HelpTooltip } from "@/components/HelpTooltip";

const CoachSpace = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 to-white pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="coachSpace" />
      {/* 通用顶部 Header */}
      <PageHeader
        title="教练空间"
        showHomeButton
        rightActions={
          <>
            <HelpTooltip
              title="教练空间使用指南"
              description="选择适合你的AI教练，开始成长对话"
              tips={[
                "每位教练专注不同领域，选择最匹配你需求的",
                "可以随时切换教练，对话记录会保存",
                "语音对话功能让交流更自然"
              ]}
            />
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach-space-intro')}>
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
          </>
        }
      />

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
          <span>🧭</span> 教练空间
        </h3>
        
        {isLoading ? (
          <>
            <LoadingMessage message="正在为您加载专属教练..." />
            <CoachCardSkeleton count={4} />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {templates?.map((coach, index) => (
              <EnhancedCoachCard key={coach.id} coach={coach} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* 绽放教练入口 */}
      <section className="px-4 pb-8">
        <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <span>👩‍🏫</span> 真人教练
        </h3>
        <div className="flex flex-col gap-3">
          <HumanCoachEntry />
          <TeamCoachingEntry />
        </div>
      </section>
    </div>
  );
};

export default CoachSpace;
