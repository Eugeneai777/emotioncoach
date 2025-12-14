import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeenVoiceCallCTAProps {
  onVoiceChatClick: () => void;
  teenNickname?: string;
  disabled?: boolean;
}

export function TeenVoiceCallCTA({ 
  onVoiceChatClick, 
  teenNickname,
  disabled = false
}: TeenVoiceCallCTAProps) {
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    onVoiceChatClick();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent mb-2">
          {teenNickname ? `Hey ${teenNickname}～` : 'Hey～'}
        </h2>
        <p className="text-muted-foreground text-sm">
          有什么想聊的吗？
        </p>
      </motion.div>

      {/* Large circular voice button */}
      <div className="relative">
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400/30 to-pink-400/30 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: '160px', height: '160px', margin: '-10px' }}
        />

        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-violet-400/50"
          animate={{
            scale: [1, 1.3],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ width: '140px', height: '140px' }}
        />

        {/* Ripple effect on click */}
        {isRippling && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '140px', height: '140px' }}
          />
        )}

        {/* Main button */}
        <motion.button
          onClick={handleClick}
          disabled={disabled}
          className="relative w-[140px] h-[140px] rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-2xl flex flex-col items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          style={{
            boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)',
          }}
        >
          <Phone className="h-10 w-10 mb-1" />
          <span className="text-sm font-medium">开始聊天</span>
        </motion.button>
      </div>

      {/* Prompt text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-muted-foreground text-center"
      >
        点击按钮，说出你的心声 💜
      </motion.p>
    </div>
  );
}
