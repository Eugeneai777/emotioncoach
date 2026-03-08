import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BookOpen, BarChart3, Wrench } from "lucide-react";

const paths = [
  {
    icon: Phone,
    label: "不太舒服",
    sub: "即刻陪伴",
    desc: "当你感到焦虑、低落、压力山大……不需要找到原因，直接开口说就好。AI教练会在第一时间接住你。",
    route: "/emotion-button",
    iconColor: "text-pink-400",
    bg: "bg-pink-500/8",
    ring: "ring-pink-500/15",
  },
  {
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    desc: "把每天的情绪、想法写下来。AI帮你发现隐藏的模式，见证一点一滴的成长。",
    route: "/awakening",
    iconColor: "text-amber-400",
    bg: "bg-amber-500/8",
    ring: "ring-amber-500/15",
  },
  {
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    desc: "通过科学的心理测评工具，深度了解自己的情绪模式和内在需求。",
    route: "/assessment-picker",
    iconColor: "text-blue-400",
    bg: "bg-blue-500/8",
    ring: "ring-blue-500/15",
  },
  {
    icon: Wrench,
    label: "真正改变",
    sub: "系统训练",
    desc: "在AI教练+真人教练的双重陪伴下，用科学方法重塑情绪模式，实现蜕变。",
    route: "/camps",
    iconColor: "text-violet-400",
    bg: "bg-violet-500/8",
    ring: "ring-violet-500/15",
  },
];

const PathDetailCards = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-medium text-stone-400 px-0.5">四条路径，总有一条适合你</h3>
      <div className="grid grid-cols-2 gap-2">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={i}
              onClick={() => navigate(path.route)}
              className={`text-left p-3 rounded-2xl ${path.bg} ring-1 ${path.ring} active:scale-[0.97] transition-transform duration-150`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${path.iconColor} shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-stone-200">{path.label}</p>
                  <p className="text-[9px] text-stone-500">{path.sub}</p>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">{path.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PathDetailCards;
