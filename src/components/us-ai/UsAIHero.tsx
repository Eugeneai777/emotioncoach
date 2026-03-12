import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";

interface UsAIHeroProps {
  onStart: () => void;
  onLearnMore: () => void;
}

const UsAIHero = ({ onStart, onLearnMore }: UsAIHeroProps) => (
  <section className="relative overflow-hidden px-6 pt-16 pb-12">
    {/* Decorative blurred circles */}
    <div className="absolute top-[-60px] right-[-40px] w-52 h-52 rounded-full bg-usai-primary/20 blur-3xl" />
    <div className="absolute bottom-[-30px] left-[-50px] w-40 h-40 rounded-full bg-usai-accent/15 blur-3xl" />

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 text-center space-y-5"
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-usai-light border border-usai-primary/20 text-usai-primary text-xs font-medium">
        <Heart className="w-3 h-3" /> 情侣关系助手
      </div>

      <h1 className="text-4xl font-bold text-usai-foreground tracking-tight">我们AI</h1>
      <p className="text-lg text-usai-primary font-medium">两个人，更懂彼此</p>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        很多关系不是没有爱，<br />而是不知道怎么表达。<br />
        <span className="text-usai-foreground font-medium">我们AI，帮你把心里的话说出来。</span>
      </p>

      <div className="flex flex-col gap-3 pt-2 max-w-xs mx-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-3.5 rounded-2xl bg-usai-primary text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-usai-primary/25"
        >
          开始体验 <ArrowRight className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onLearnMore}
          className="w-full py-3 rounded-2xl border border-usai-primary/20 text-usai-primary font-medium text-sm bg-white/60"
        >
          看看怎么用
        </motion.button>
      </div>
    </motion.div>
  </section>
);

export default UsAIHero;
