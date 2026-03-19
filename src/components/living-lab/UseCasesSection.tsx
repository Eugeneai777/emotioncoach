import { motion } from "framer-motion";
import { Moon, Briefcase, Heart, TrendingUp } from "lucide-react";

const cases = [
  {
    icon: Moon,
    title: "深夜焦虑时",
    desc: "凌晨两点翻来覆去，你不想打扰任何人——AI教练24小时在线，随时接住你。",
    iconColor: "text-indigo-400",
    bg: "bg-indigo-500/8",
  },
  {
    icon: Briefcase,
    title: "职场迷茫时",
    desc: "不知道该不该换工作、该不该开口……AI帮你看见选择背后的恐惧与渴望。",
    iconColor: "text-amber-400",
    bg: "bg-amber-500/8",
  },
  {
    icon: Heart,
    title: "关系困扰时",
    desc: "吵完架的委屈、说不出口的话……在这里可以安全地说出一切，被理解不被评判。",
    iconColor: "text-rose-400",
    bg: "bg-rose-500/8",
  },
  {
    icon: TrendingUp,
    title: "财富渴望时",
    desc: "总觉得赚得不少却存不下来？AI帮你找到财富卡点，打通金钱信念。",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/8",
  },
];

const UseCasesSection = () => {
  return (
    <div className="space-y-2.5">
      <div className="px-0.5">
        <h3 className="text-xs font-medium text-stone-400">什么时候可以找有劲AI？</h3>
        <p className="text-[10px] text-stone-600 mt-0.5">任何时刻，任何情绪，它都在</p>
      </div>
      <div className="space-y-2">
        {cases.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={i}
              className={`p-3 rounded-xl ${c.bg} ring-1 ring-stone-700/30`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 ${c.iconColor} shrink-0 mt-0.5`} />
                <div>
                  <h4 className="text-[11px] font-semibold text-stone-300 mb-0.5">{c.title}</h4>
                  <p className="text-[10px] text-stone-500 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default UseCasesSection;
