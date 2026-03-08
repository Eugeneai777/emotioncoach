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
    color: "text-rose-400",
    bg: "bg-rose-500/12",
    ring: "ring-rose-400/20",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    color: "text-amber-400",
    bg: "bg-amber-500/12",
    ring: "ring-amber-400/20",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    color: "text-teal-400",
    bg: "bg-teal-500/12",
    ring: "ring-teal-400/20",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    color: "text-violet-400",
    bg: "bg-violet-500/12",
    ring: "ring-violet-400/20",
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
      {/* Hero Voice CTA */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800/90 to-stone-900 p-6 border border-stone-700/40"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Subtle warm glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-rose-500/6 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-stone-400 text-xs mb-4 tracking-wide">{greeting}</p>

          {/* Voice button */}
          <button
            onClick={handleVoiceClick}
            className="relative group focus:outline-none touch-manipulation mb-4"
            aria-label="开始语音对话"
          >
            {/* Breathing rings */}
            <motion.div
              className="absolute inset-[-16px] rounded-full border border-amber-300/10"
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-[-8px] rounded-full border border-rose-300/12"
              animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* Button */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full flex flex-col items-center justify-center
                            shadow-lg shadow-amber-500/10
                            group-active:scale-95 transition-transform duration-200">
              <Mic className="w-7 h-7 text-rose-400 mb-0.5" />
              <span className="text-[9px] font-bold text-rose-500/90">点击对话</span>
            </div>
          </button>

          <p className="text-stone-500 text-[11px] tracking-wider">随时开口，我在</p>
        </div>
      </motion.div>

      {/* 4 Quick Paths */}
      <div className="grid grid-cols-4 gap-2">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className="group flex flex-col items-center gap-2 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-12 h-12 rounded-2xl ${path.bg} ring-1 ${path.ring} flex items-center justify-center
                              group-active:scale-90 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${path.color}`} />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium text-stone-300 leading-tight">{path.label}</p>
                <p className="text-[9px] text-stone-500 mt-0.5">{path.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
