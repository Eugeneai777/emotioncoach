import { motion } from "framer-motion";

const tiredReasons = [
  { label: "孩子", emoji: "👶", context: "今天带孩子让我很累，孩子太难带了" },
  { label: "老公", emoji: "💔", context: "今天老公让我很累，感觉不被理解" },
  { label: "家庭", emoji: "🏠", context: "今天家庭事务让我很累，做不完的家务" },
  { label: "工作", emoji: "💼", context: "今天工作让我很累，还要兼顾家庭" },
  { label: "自己", emoji: "🫠", context: "今天我自己很累，感觉失去了自我" },
];

interface MamaTiredEntryProps {
  onReasonClick: (context: string) => void;
}

const MamaTiredEntry = ({ onReasonClick }: MamaTiredEntryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="mx-4 p-5 bg-white rounded-2xl shadow-sm border border-[#F5E6D3]"
    >
      <p className="text-lg font-medium text-[#3D3028] mb-1">🫂 妈妈今天好累</p>
      <p className="text-sm text-[#A89580] mb-4">今天是什么让你最累？</p>

      <div className="flex flex-wrap gap-2">
        {tiredReasons.map((r) => (
          <motion.button
            key={r.label}
            whileTap={{ scale: 0.93 }}
            onClick={() => onReasonClick(r.context)}
            className="px-4 py-2.5 bg-[#FFF3EB] rounded-xl text-[#3D3028] text-sm hover:bg-[#FFE8D6] transition-all"
          >
            {r.emoji} {r.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default MamaTiredEntry;
