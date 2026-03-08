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
    gradient: "from-rose-400/80 to-pink-400/70",
    glow: "shadow-rose-400/15",
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    gradient: "from-amber-400/80 to-orange-400/70",
    glow: "shadow-amber-400/15",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    gradient: "from-teal-400/80 to-emerald-400/70",
    glow: "shadow-teal-400/15",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    gradient: "from-purple-400/80 to-violet-400/70",
    glow: "shadow-purple-400/15",
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
    <div className="space-y-8">
      {/* Hero: Voice Coach CTA — 温暖有机 */}
      <motion.div
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-rose-500/90 via-amber-600/80 to-rose-400/90 p-7 pb-6 border border-rose-300/15"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Warm decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-rose-300/12 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-amber-200/8 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-amber-100 text-sm mb-5">{greeting}</p>

          {/* Pulsing voice button */}
          <button
            onClick={handleVoiceClick}
            className="relative group focus:outline-none touch-manipulation mb-5"
            aria-label="开始语音对话"
          >
            {/* Soft breathing glow — warm tones */}
            <motion.div
              className="absolute inset-[-18px] rounded-full border-2 border-amber-200/15"
              animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-[-10px] rounded-full border border-rose-200/20"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
            <motion.div
              className="absolute inset-[-24px] rounded-full bg-amber-200/5"
              animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            
            {/* Button — warm cream */}
            <div className="relative w-[92px] h-[92px] bg-amber-50 rounded-full flex flex-col items-center justify-center
                            shadow-lg shadow-rose-900/15
                            group-hover:scale-110 group-active:scale-95
                            transition-transform duration-300 ease-out">
              <Mic className="w-8 h-8 text-rose-400 mb-0.5" />
              <span className="text-[10px] font-bold text-rose-500">点击对话</span>
            </div>
          </button>

          <p className="text-rose-200/70 text-[13px] tracking-wide">随时开口，我在</p>
        </div>
      </motion.div>

      {/* 4 Quick Paths — warm organic */}
      <div className="grid grid-cols-4 gap-3">
        {paths.map((path, i) => {
          const Icon = path.icon;
          return (
            <motion.button
              key={path.id}
              onClick={() => navigate(path.route)}
              className="group flex flex-col items-center gap-2.5 focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${path.gradient} flex items-center justify-center
                              shadow-sm ${path.glow}
                              group-hover:scale-110 group-active:scale-95
                              transition-all duration-300 ease-out`}>
                <Icon className="w-6 h-6 text-white/90 drop-shadow-sm" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-stone-200 leading-tight">{path.label}</p>
                <p className="text-[10px] text-stone-400">{path.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuperEntry;
