import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BookOpen, BarChart3, Wrench, Mic } from "lucide-react";
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
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    ring: "ring-pink-500/20",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  {
    id: "change",
    icon: Wrench,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
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
    <div className="space-y-7">
      {/* Hero Voice CTA — 珊瑚粉渐变 */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 p-8 pb-7"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Soft light overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/10" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-white/80 text-sm mb-6 tracking-wide">{greeting}</p>

          {/* Voice button — large white circle */}
          <button
            onClick={handleVoiceClick}
            className="relative group focus:outline-none touch-manipulation mb-5"
            aria-label="开始语音对话"
          >
            {/* Breathing ring */}
            <motion.div
              className="absolute inset-[-14px] rounded-full border-2 border-white/15"
              animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* White circle button */}
            <div className="relative w-[88px] h-[88px] bg-white rounded-full flex flex-col items-center justify-center
                            shadow-xl shadow-rose-900/20
                            group-active:scale-95 transition-transform duration-200">
              <Mic className="w-8 h-8 text-rose-400 mb-1" />
              <span className="text-[10px] font-bold text-rose-500">点击对话</span>
            </div>
          </button>

          <p className="text-white/60 text-xs tracking-wider">随时开口，我在</p>
        </div>
      </motion.div>

      {/* 4 Quick Paths — dark rounded squares */}
      <div className="grid grid-cols-4 gap-3">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className="group flex flex-col items-center gap-2.5 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-14 h-14 rounded-2xl ${path.bg} ring-1 ${path.ring} flex items-center justify-center
                              group-active:scale-90 transition-transform duration-200`}>
                <Icon className={`w-6 h-6 ${path.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-stone-200 leading-tight">{path.label}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">{path.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
