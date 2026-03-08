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
  },
  {
    id: "record",
    icon: BookOpen,
    label: "记录觉察",
    sub: "看见变化",
    route: "/awakening",
    gradient: "from-amber-400/80 to-orange-400/70",
  },
  {
    id: "assess",
    icon: BarChart3,
    label: "看清自己",
    sub: "专业测评",
    route: "/assessment-picker",
    gradient: "from-teal-400/80 to-emerald-400/70",
  },
  {
    id: "change",
    icon: Rocket,
    label: "真正改变",
    sub: "系统训练",
    route: "/camps",
    gradient: "from-purple-400/80 to-violet-400/70",
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
    <div className="relative min-h-[72vh] flex flex-col justify-between">
      {/* Full-screen warm background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-rose-500/10 blur-[80px]" />
        <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full bg-amber-500/8 blur-[60px]" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-rose-400/6 blur-[50px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-300/5 blur-[100px]" />
      </div>

      {/* Center: greeting + voice button */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-8 pb-12">
        <motion.p
          className="text-amber-200/80 text-base mb-8 tracking-wide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {greeting}
        </motion.p>

        {/* Pulsing voice button — larger for immersive feel */}
        <motion.button
          onClick={handleVoiceClick}
          className="relative group focus:outline-none touch-manipulation mb-6"
          aria-label="开始语音对话"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer breathing glow */}
          <motion.div
            className="absolute inset-[-28px] rounded-full border-2 border-amber-200/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-[-16px] rounded-full border border-rose-200/15"
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.div
            className="absolute inset-[-36px] rounded-full bg-amber-200/3"
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />

          {/* Button */}
          <div className="relative w-[100px] h-[100px] bg-amber-50 rounded-full flex flex-col items-center justify-center
                          shadow-lg shadow-rose-900/15
                          group-hover:scale-110 group-active:scale-95
                          transition-transform duration-300 ease-out">
            <Mic className="w-9 h-9 text-rose-400 mb-0.5" />
            <span className="text-[10px] font-bold text-rose-500">点击对话</span>
          </div>
        </motion.button>

        <motion.p
          className="text-rose-200/60 text-sm tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          随时开口，我在
        </motion.p>
      </div>

      {/* Bottom: floating glassmorphism quick-path bar */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-sm mb-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {paths.map((path) => {
              const Icon = path.icon;
              return (
                <button
                  key={path.id}
                  onClick={() => navigate(path.route)}
                  className="group flex flex-col items-center gap-1.5 py-1.5 focus:outline-none touch-manipulation"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${path.gradient} flex items-center justify-center
                                  group-hover:scale-110 group-active:scale-95
                                  transition-transform duration-300 ease-out`}>
                    <Icon className="w-5 h-5 text-white/90" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-stone-300 leading-tight">{path.label}</p>
                    <p className="text-[9px] text-stone-500">{path.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperEntry;
