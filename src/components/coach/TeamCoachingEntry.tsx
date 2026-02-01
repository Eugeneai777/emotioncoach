import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TeamCoachingEntry = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/team-coaching')}
      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 
                 border border-purple-100 cursor-pointer 
                 hover:shadow-lg active:shadow-inner transition-all duration-300"
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 
                        flex items-center justify-center shadow-lg flex-shrink-0">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800">绽放海沃塔 · 团队教练</h4>
            <Badge className="bg-purple-500 text-[10px] px-1.5 py-0.5">团队</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">小组共学 · 深度对话 · 共同成长</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              深度陪伴
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-pink-500" />
              小组互动
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>
    </motion.div>
  );
};
