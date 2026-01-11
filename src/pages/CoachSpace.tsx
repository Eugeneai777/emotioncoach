import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Bell, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { EnhancedCoachCard } from "@/components/coach/EnhancedCoachCard";
import { HumanCoachEntry } from "@/components/coach/HumanCoachEntry";
import PageHeader from "@/components/PageHeader";

const CoachSpace = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-[env(safe-area-inset-bottom)]">
      <Helmet>
        <title>教练空间 - 有劲AI</title>
        <meta name="description" content="选择你的专属AI教练，开启成长之旅" />
        <meta property="og:title" content="有劲AI教练空间" />
        <meta property="og:description" content="7位专业AI教练，24小时陪伴你成长" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/coach-space" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* 通用顶部 Header */}
      <PageHeader
        title="教练空间"
        rightActions={
          <>
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
