import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BookOpen, BarChart3, Rocket } from "lucide-react";

const paths = [
  {
    icon: Phone,
    label: "不太舒服",
    sub: "即刻陪伴",
    desc: "当你感到焦虑、低落、压力山大……不需要找到原因，不需要组织语言，直接开口说就好。AI教练会在第一时间接住你。",
    route: "/emotion-button",
    gradient: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    desc: "把每天的情绪、想法、觉察写下来。AI会帮你发现隐藏的模式，见证你一点一滴的成长。",
    route: "/awakening",
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    desc: "通过科学的心理测评工具，深度了解自己的情绪模式、性格特质和内在需求。知道自己在哪里，才知道往哪里走。",
    route: "/assessment-picker",
    gradient: "from-teal-500/20 to-emerald-500/10",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    desc: "加入21天训练营，在AI教练+真人教练的双重陪伴下，用科学方法重塑情绪模式，实现真正的蜕变。",
    route: "/camps",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
];

const PathDetailCards = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-300 px-1">四条路径，总有一条适合你</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={i}
              onClick={() => navigate(path.route)}
              className={`text-left p-4 rounded-2xl bg-gradient-to-br ${path.gradient} backdrop-blur-sm border ${path.border} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-xl bg-stone-800/60 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${path.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-100">{path.label}</p>
                  <p className="text-[10px] text-stone-400">{path.sub}</p>
                </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">{path.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PathDetailCards;
