import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Props {
  onStart: () => void;
}

const UsAICTA = ({ onStart }: Props) => (
  <section className="px-5 text-center space-y-4 py-4">
    <h2 className="text-xl font-bold text-usai-foreground">关系是可以练习的</h2>
    <p className="text-sm text-muted-foreground">每天 3 分钟，关系越来越好</p>
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className="w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-usai-primary text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-usai-primary/25"
    >
      开始使用我们AI <ArrowRight className="w-4 h-4" />
    </motion.button>
  </section>
);

export default UsAICTA;
