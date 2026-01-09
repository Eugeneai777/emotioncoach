import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface LayerTransitionHintProps {
  from: 'behavior' | 'emotion' | 'belief';
  to: 'emotion' | 'belief' | 'action';
}

const transitionMessages: Record<string, { text: string; subtext: string }> = {
  'behavior-emotion': {
    text: '行为是表象，情绪才是驱动力',
    subtext: '你的消费行为背后，藏着怎样的情绪模式？'
  },
  'emotion-belief': {
    text: '情绪背后，是更深的信念在运作',
    subtext: '是什么核心信念，一直在影响你与财富的关系？'
  },
  'belief-action': {
    text: '改变信念，才能从根本转化模式',
    subtext: '21天训练营帮你重塑财富信念系统'
  }
};

export function LayerTransitionHint({ from, to }: LayerTransitionHintProps) {
  const key = `${from}-${to}`;
  const message = transitionMessages[key];
  
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="py-3 my-4"
    >
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">{message.text}</p>
        </div>
        <motion.div
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </div>
    </motion.div>
  );
}
