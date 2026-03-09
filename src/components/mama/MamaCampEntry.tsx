import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MamaCampEntry = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      className="mx-3 p-4 rounded-xl border border-[#E8D5C4]/60 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFF3EB 0%, #FFE8D6 50%, #FFF0F5 100%)",
      }}
    >
      <div className="relative z-10">
        <p className="text-base font-medium text-[#3D3028] mb-0.5">🌈 21天亲子关系训练营</p>
        <p className="text-xs text-[#8B7355] mb-1">每天15分钟，系统提升亲子沟通能力</p>
        <div className="flex items-center gap-2 my-2.5 flex-wrap">
          <span className="text-[11px] text-[#F4845F] font-medium bg-[#F4845F]/10 px-2 py-0.5 rounded-full">专业教练</span>
          <span className="text-[11px] text-[#4CAF7D] font-medium bg-[#4CAF7D]/10 px-2 py-0.5 rounded-full">社群支持</span>
          <span className="text-[11px] text-[#5B8DEF] font-medium bg-[#5B8DEF]/10 px-2 py-0.5 rounded-full">每日打卡</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/parent-camp")}
          className="w-full py-2.5 bg-[#F4845F] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1 active:bg-[#E5734E] transition-all min-h-[44px]"
        >
          了解详情 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MamaCampEntry;
