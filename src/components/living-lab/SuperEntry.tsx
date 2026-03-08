import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BookOpen, BarChart3, Rocket, Mic } from "lucide-react";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

interface SuperEntryProps {
  onInlineTool: (toolId: string) => void;
}

const paths = [
  {
    id: "emotion",
    icon: Phone,
    label: "不太舒服",
    sub: "即刻陪伴",
    route: "/emotion-button",
    gradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/25",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    gradient: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/25",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/25",
  },
];

const SuperEntry = ({ onInlineTool }: SuperEntryProps) => {
  const navigate = useNavigate();
  const { greeting } = usePersonalizedGreeting();
  const { user } = useAuth();
  const [showVoice, setShowVoice] = useState(false);

  const handleVoiceClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowVoice(true);
  };

  if (showVoice && user) {
    return (
      <CoachVoiceChat
        onClose={() => setShowVoice(false)}
        coachEmoji="❤️"
        coachTitle="有劲AI生活教练"
        primaryColor="rose"
        tokenEndpoint="vibrant-life-realtime-token"
        userId={user.id}
        mode="general"
        featureKey="realtime_voice"
        voiceType={getSavedVoiceType()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero: Voice Coach CTA — 红色主题 */}
      <motion.div
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-600 via-red-500 to-rose-500 p-6 pb-5 border border-white/10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-pink-300/15 blur-xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-rose-100 text-sm mb-4">{greeting}</p>

          {/* Pulsing voice button */}
          <button
            onClick={handleVoiceClick}
            className="relative group focus:outline-none touch-manipulation mb-4"
            aria-label="开始语音对话"
          >
            {/* Soft breathing glow */}
            <motion.div
              className="absolute inset-[-16px] rounded-full border-2 border-white/15"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-[-8px] rounded-full border border-white/20"
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* Button */}
            <div className="relative w-[88px] h-[88px] bg-white rounded-full flex flex-col items-center justify-center
                            shadow-2xl shadow-black/20
                            group-hover:scale-110 group-active:scale-95
                            transition-transform duration-200 ease-out">
              <Mic className="w-8 h-8 text-rose-600 mb-0.5" />
              <span className="text-[10px] font-bold text-rose-700">点击对话</span>
            </div>
          </button>

          <p className="text-white/60 text-xs tracking-wide">随时开口，我在</p>
        </div>
      </motion.div>

      {/* 4 Quick Paths */}
      <div className="grid grid-cols-4 gap-3">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className="group flex flex-col items-center gap-2 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${path.gradient} flex items-center justify-center
                              shadow-lg shadow-current/20 ${path.glow}
                              group-hover:scale-110 group-hover:shadow-xl group-active:scale-95
                              transition-all duration-200 ease-out`}>
                <Icon className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white leading-tight">{path.label}</p>
                <p className="text-[10px] text-zinc-400">{path.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
