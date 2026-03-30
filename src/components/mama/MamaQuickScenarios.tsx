import { motion } from "framer-motion";

const scenarios = [
  { emoji: "😤", label: "又吼孩子了", context: "我刚才又对孩子发了脾气，现在很自责..." },
  { emoji: "😴", label: "好累好累", context: "我感觉身心俱疲，什么都不想做..." },
  { emoji: "💔", label: "没人理解我", context: "我觉得没有人理解我的感受和付出..." },
  { emoji: "😰", label: "职场好难", context: "工作压力好大，感觉快撑不住了..." },
  { emoji: "🌙", label: "睡不着", context: "半夜了还是睡不着，脑子停不下来..." },
  { emoji: "💪", label: "想变更好", context: "我想改变现状，但不知道从哪里开始..." },
  { emoji: "🥺", label: "想哭一会儿", context: "我现在很想哭，心里很难受..." },
  { emoji: "😣", label: "关系好累", context: "和家人/伴侣的关系让我很疲惫..." },
];

interface MamaQuickScenariosProps {
  onSelect: (context: string) => void;
}

const MamaQuickScenarios = ({ onSelect }: MamaQuickScenariosProps) => {
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
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-primary/15 bg-gradient-to-r from-primary/5 to-primary/12 hover:from-primary/10 hover:to-primary/18 active:from-primary/15 transition-colors text-sm font-medium text-foreground shadow-sm"
          >
            <span className="text-lg">{s.emoji}</span>
            <span>{s.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MamaQuickScenarios;
