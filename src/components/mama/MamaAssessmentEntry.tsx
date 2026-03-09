import { motion } from "framer-motion";

interface MamaAssessmentEntryProps {
  onStart: () => void;
}

const MamaAssessmentEntry = ({ onStart }: MamaAssessmentEntryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="mx-4 p-5 bg-gradient-to-br from-[#FFF3EB] to-[#FFF0F5] rounded-2xl border border-[#F5E6D3]"
    >
      <p className="text-lg font-medium text-[#3D3028] mb-1">📊 妈妈能量测评</p>
      <p className="text-sm text-[#8B7355] mb-4">你是哪一种妈妈？5题快速测评</p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onStart}
        className="w-full py-3 bg-[#F4845F] text-white rounded-xl font-medium hover:bg-[#E5734E] transition-all"
      >
        开始测评 →
      </motion.button>
    </motion.div>
  );
};

export default MamaAssessmentEntry;
