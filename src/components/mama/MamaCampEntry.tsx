import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MamaCampEntry = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35 }}
      className="mx-4 p-3.5 rounded-2xl border border-[hsl(30_50%_88%)] relative overflow-hidden shadow-[0_2px_8px_hsl(16_86%_68%/0.1)]"
      style={{
        background: "linear-gradient(135deg, hsl(25 100% 96%) 0%, hsl(25 100% 92%) 50%, hsl(340 60% 97%) 100%)",
      }}
    >
      <div className="relative z-10">
        <p className="text-sm font-semibold mb-0.5" style={{ color: "hsl(25 25% 17%)" }}>🌈 21天亲子关系训练营</p>
        <p className="text-[11px] mb-1.5" style={{ color: "hsl(30 20% 44%)" }}>每天15分钟，系统提升亲子沟通能力</p>
        <div className="flex items-center gap-1.5 my-2 flex-wrap">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "hsl(16 86% 58%)", background: "hsl(16 86% 68% / 0.12)" }}>专业教练</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "hsl(152 42% 39%)", background: "hsl(152 42% 49% / 0.12)" }}>社群支持</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: "hsl(220 80% 55%)", background: "hsl(220 80% 65% / 0.12)" }}>每日打卡</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/parent-camp")}
          className="w-full py-2.5 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-all min-h-[44px] active:opacity-90"
          style={{ background: "hsl(16 86% 68%)" }}
        >
          了解详情 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MamaCampEntry;
