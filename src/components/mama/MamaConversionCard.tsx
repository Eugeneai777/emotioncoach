import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ConversionItem {
  keywords: string[];
  emoji: string;
  title: string;
  desc: string;
  route: string;
  color: string;
  accent: string;
}

const conversions: ConversionItem[] = [
  {
    keywords: ["孩子", "不听话", "教育", "沟通", "叛逆", "打人", "哭闹", "不爱学", "作业", "拖拉"],
    emoji: "📋",
    title: "亲子沟通能力测评",
    desc: "3分钟了解你的亲子沟通模式，获取专属改善建议",
    route: "/assessment/communication_parent",
    color: "bg-[#FFF3EB]",
    accent: "#F4845F",
  },
  {
    keywords: ["累", "疲惫", "压力", "焦虑", "烦", "崩溃", "抑郁", "失眠", "情绪", "哭"],
    emoji: "💛",
    title: "情绪健康自评",
    desc: "3分钟了解你的情绪状态，获得科学建议",
    route: "/assessment/emotion_health",
    color: "bg-[#FFF0F5]",
    accent: "#E879A0",
  },
  {
    keywords: ["老公", "婆婆", "家庭", "关系", "吵架", "冷战", "离婚", "不理解"],
    emoji: "🌈",
    title: "21天亲子关系训练营",
    desc: "每天15分钟，系统提升家庭沟通能力",
    route: "/parent-camp",
    color: "bg-[#F0FFF4]",
    accent: "#4CAF7D",
  },
  {
    keywords: ["迷茫", "方向", "成长", "自我", "价值", "工作", "职场", "未来"],
    emoji: "✨",
    title: "女性竞争力测评",
    desc: "找到你的优势方向，开启个人成长之路",
    route: "/assessment/women_competitiveness",
    color: "bg-[#F0F4FF]",
    accent: "#5B8DEF",
  },
];

interface MamaConversionCardProps {
  context?: string;
  messageCount: number;
  onClose?: () => void;
}

const MamaConversionCard = ({ context, messageCount, onClose }: MamaConversionCardProps) => {
  const navigate = useNavigate();

  // Only show after 2+ rounds of conversation
  if (messageCount < 4) return null;

  // Match context to conversion item
  const allText = (context || "").toLowerCase();
  const matched = conversions.find((c) =>
    c.keywords.some((kw) => allText.includes(kw))
  );

  if (!matched) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={`${matched.color} rounded-2xl p-4 border border-[#F5E6D3]/60 mx-1`}
    >
      <p className="text-xs text-[#A89580] mb-1">💡 也许你还想了解</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{matched.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#3D3028]">{matched.title}</p>
          <p className="text-xs text-[#8B7355] mt-0.5">{matched.desc}</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          onClose?.();
          navigate(matched.route);
        }}
        className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-1"
        style={{ backgroundColor: matched.accent }}
      >
        免费了解一下 <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  );
};

export default MamaConversionCard;
