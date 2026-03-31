import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TeamCoachingEntry = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36, type: "spring", stiffness: 120, damping: 18 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/team-coaching')}
      className="group relative flex bg-white rounded-2xl shadow-sm hover:shadow-lg 
                 transition-all duration-300 cursor-pointer overflow-hidden border border-purple-100
                 hover:border-purple-200"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* 左侧色块 */}
      <div className="w-1.5 bg-purple-500 rounded-r-full flex-shrink-0 my-3" />

      <div className="flex items-center gap-3.5 p-4 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-2xl ring-2 ring-purple-200 bg-gradient-to-br from-purple-400 to-pink-500 
                        flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-300
                        group-hover:scale-105">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[15px] text-slate-800">绽放海沃塔 · 团队教练</h4>
            <Badge className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-[10px] px-2 py-0.5 font-semibold rounded-full border-0 shadow-sm">
              团队
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">小组共学 · 深度对话 · 共同成长</p>
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
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 transition-all duration-300
                                  group-hover:text-purple-500 group-hover:translate-x-0.5" />
      </div>
    </motion.div>
  );
};
