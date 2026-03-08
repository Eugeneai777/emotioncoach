import { motion } from "framer-motion";
import { Moon, Briefcase, Heart, TrendingUp } from "lucide-react";

const cases = [
  {
    icon: Moon,
    title: "深夜焦虑时",
    desc: "凌晨两点，翻来覆去睡不着，脑子里全是明天的担忧。你不想打扰任何人，但又需要有人听你说——AI教练24小时在线，随时接住你。",
    iconColor: "text-indigo-400",
    bg: "from-indigo-500/15 to-indigo-500/5",
  },
  {
    icon: Briefcase,
    title: "职场迷茫时",
    desc: "不知道该不该换工作、该不该开口争取、该不该妥协……AI教练帮你梳理内心真正的声音，看见选择背后的恐惧与渴望。",
    iconColor: "text-amber-400",
    bg: "from-amber-500/15 to-amber-500/5",
  },
  {
    icon: Heart,
    title: "关系困扰时",
    desc: "和伴侣吵完架的委屈、对父母说不出口的话、友谊中的不安……在这里你可以安全地说出一切，被理解而不被评判。",
    iconColor: "text-rose-400",
    bg: "from-rose-500/15 to-rose-500/5",
  },
  {
    icon: TrendingUp,
    title: "想要成长时",
    desc: "你已经意识到某些模式在重复，想要真正改变。AI教练会陪你一步步觉察、记录、突破，见证你的每一个进步。",
    iconColor: "text-emerald-400",
    bg: "from-emerald-500/15 to-emerald-500/5",
  },
];

const UseCasesSection = () => {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h3 className="text-sm font-medium text-stone-300">什么时候可以找有劲AI？</h3>
        <p className="text-[11px] text-stone-500 mt-0.5">任何时刻，任何情绪，它都在</p>
      </div>
      <div className="space-y-2.5">
        {cases.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={i}
              className={`p-4 rounded-2xl bg-gradient-to-r ${c.bg} border border-stone-700/30 backdrop-blur-sm`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <Icon className={`w-4 h-4 ${c.iconColor} shrink-0`} />
                <h4 className="text-sm font-semibold text-stone-200">{c.title}</h4>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed pl-6.5">{c.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default UseCasesSection;
