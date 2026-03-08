import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Phone, PhoneOff, Settings2 } from "lucide-react";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

const LifeCoachVoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { greeting } = usePersonalizedGreeting();
  const [isCallActive, setIsCallActive] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Cycle pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPulse((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartCall = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsCallActive(true);
  };

  if (isCallActive) {
    return (
      <CoachVoiceChat
        onClose={() => setIsCallActive(false)}
        coachEmoji="🌿"
        coachTitle="AI生活教练"
        primaryColor="emerald"
        tokenEndpoint="vibrant-life-realtime-token"
        userId={user?.id}
        mode="general"
        featureKey="realtime_voice"
        voiceType={getSavedVoiceType()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-teal-500/8 blur-[80px]" />
        <div className="absolute top-1/3 right-0 w-[200px] h-[200px] rounded-full bg-cyan-500/8 blur-[60px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 text-white/80" />
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center touch-manipulation"
        >
          <Settings2 className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Coach avatar */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer glow rings */}
          <div className="absolute inset-[-24px] rounded-full border border-emerald-400/20 animate-pulse" />
          <div className="absolute inset-[-40px] rounded-full border border-emerald-400/10" />
          
          {/* Avatar circle */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <span className="text-5xl">🌿</span>
          </div>
          
          {/* Online indicator */}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-emerald-900 shadow-lg shadow-green-400/50" />
        </motion.div>

        {/* Title & greeting */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">AI 生活教练</h1>
          <p className="text-emerald-200/70 text-sm">{greeting}</p>
          <p className="text-emerald-300/50 text-xs mt-2">语音 · 文字 · 什么都可以聊</p>
        </motion.div>

        {/* Call button */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Animated pulse rings */}
          <AnimatePresence>
            {showPulse && (
              <>
                <motion.div
                  className="absolute inset-[-20px] rounded-full border-2 border-emerald-400/30"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-[-12px] rounded-full border border-emerald-400/40"
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
              </>
            )}
          </AnimatePresence>

          <button
            onClick={handleStartCall}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center
                       shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-400/50
                       hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
          >
            <Phone className="w-10 h-10 text-white" />
          </button>
        </motion.div>

        {/* Hint text */}
        <motion.p
          className="text-emerald-300/40 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          点击开始通话
        </motion.p>
      </div>

      {/* Bottom features */}
      <motion.div
        className="relative z-10 px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-6 text-emerald-300/50 text-xs">
          <div className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            <span>智能语音</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>隐私保护</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
          <div className="flex items-center gap-1.5">
            <span>24h</span>
            <span>随时可聊</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LifeCoachVoice;
