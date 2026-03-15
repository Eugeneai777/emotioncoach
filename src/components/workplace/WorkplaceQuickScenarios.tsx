import { motion } from "framer-motion";

const scenarios = [
  { emoji: "🔥", label: "职场倦怠", context: "我对工作已经完全提不起兴趣了，每天上班都很痛苦..." },
  { emoji: "😰", label: "开会焦虑", context: "明天要开一个很重要的会议，我现在非常焦虑..." },
  { emoji: "😩", label: "加班疲惫", context: "又加班了，感觉身体和精神都到了极限..." },
  { emoji: "😤", label: "同事冲突", context: "和同事发生了不愉快，心情很糟糕..." },
  { emoji: "😔", label: "升职无望", context: "在公司看不到发展前景，不知道该不该离开..." },
  { emoji: "🤯", label: "任务太多", context: "手上的任务堆积如山，完全不知道从哪里开始..." },
];

interface WorkplaceQuickScenariosProps {
  onSelect: (context: string) => void;
}

const WorkplaceQuickScenarios = ({ onSelect }: WorkplaceQuickScenariosProps) => {
  return (
    <div className="px-4 pt-2">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {scenarios.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onSelect(s.context)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-blue-200/40 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100/80 hover:to-indigo-100/80 active:from-blue-100 transition-colors text-sm font-medium text-foreground shadow-sm"
          >
            <span className="text-lg">{s.emoji}</span>
            <span>{s.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WorkplaceQuickScenarios;
