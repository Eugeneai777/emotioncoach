import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

// 第一层互动演示：轻点记录
export const Layer1Demo: React.FC = () => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  const entries = [
    { emoji: '🔥', name: '情绪' },
    { emoji: '💛', name: '感恩' },
    { emoji: '⚡', name: '行动' },
  ];

  const handleSelect = (name: string) => {
    setSelectedEntry(name);
    setShowResponse(false);
    setTimeout(() => setShowResponse(true), 500);
  };

  return (
    <div className="bg-amber-50/50 rounded-xl p-4 space-y-3">
      <p className="text-xs text-amber-700 font-medium text-center">✨ 试试看：点击一个入口</p>
      
      <div className="flex justify-center gap-2">
        {entries.map((entry) => (
          <motion.button
            key={entry.name}
            onClick={() => handleSelect(entry.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
              selectedEntry === entry.name 
                ? 'bg-amber-200 ring-2 ring-amber-400' 
                : 'bg-white hover:bg-amber-100'
            }`}
          >
            <span className="text-xl">{entry.emoji}</span>
            <span className="text-xs text-foreground">{entry.name}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showResponse && selectedEntry && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-white rounded-lg p-3 border border-amber-200"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <div className="text-sm">
                <p className="text-foreground font-medium">太好了！你选择了「{selectedEntry}」</p>
                <p className="text-muted-foreground text-xs mt-1">
                  就这么简单，一个点击就是一次记录的开始 🌱
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 第二层互动演示：AI回应展示
export const Layer2Demo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: '👁️', text: '看见你最近有些焦虑…' },
    { icon: '💙', text: '这样感觉很正常的' },
    { icon: '💡', text: '也许是因为对结果太在意' },
    { icon: '🔄', text: '试着关注过程而非结果' },
    { icon: '🎯', text: '现在深呼吸3次就够了' },
  ];

  const handlePlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentStep(0);

    steps.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i + 1);
        if (i === steps.length - 1) {
          setTimeout(() => setIsPlaying(false), 1500);
        }
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="bg-blue-50/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-blue-700 font-medium">✨ 体验AI的5件事</p>
        <motion.button
          onClick={handlePlay}
          disabled={isPlaying}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isPlaying 
              ? 'bg-blue-200 text-blue-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isPlaying ? '正在展示...' : '点击演示'}
        </motion.button>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: currentStep > i ? 1 : 0.3,
              x: currentStep > i ? 0 : -10,
              scale: currentStep === i + 1 ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              currentStep > i ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <span className="text-base">{step.icon}</span>
            <span className="text-sm text-foreground">{step.text}</span>
            {currentStep > i && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                <Check className="w-4 h-4 text-blue-500" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 第三层互动演示：继续深聊按钮
export const Layer3Demo: React.FC = () => {
  const [clicked, setClicked] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const coaches = [
    { emoji: '🔥', name: '情绪教练' },
    { emoji: '⚡', name: '行动教练' },
    { emoji: '💬', name: '沟通教练' },
  ];

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setShowCoach(true), 600);
  };

  const handleReset = () => {
    setClicked(false);
    setShowCoach(false);
  };

  return (
    <div className="bg-purple-50/50 rounded-xl p-4 space-y-3">
      <p className="text-xs text-purple-700 font-medium text-center">✨ 点击体验「继续深聊」</p>

      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          {!clicked ? (
            <motion.button
              key="button"
              onClick={handleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              继续深聊
            </motion.button>
          ) : (
            <motion.div
              key="response"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-3"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-purple-700"
              >
                正在为你匹配最合适的教练…
              </motion.div>

              <AnimatePresence>
                {showCoach && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center gap-2"
                  >
                    {coaches.map((coach, i) => (
                      <motion.div
                        key={coach.name}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: i === 0 ? 1 : 0.4, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex flex-col items-center p-2 rounded-lg ${
                          i === 0 ? 'bg-purple-200 ring-2 ring-purple-400' : 'bg-white'
                        }`}
                      >
                        <span className="text-lg">{coach.emoji}</span>
                        <span className="text-xs">{coach.name}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {showCoach && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <button
                    onClick={handleReset}
                    className="text-xs text-purple-500 underline"
                  >
                    重新体验
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 第四层互动演示：训练营预览
export const Layer4Demo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camp' | 'coach'>('camp');

  return (
    <div className="bg-teal-50/50 rounded-xl p-4 space-y-3">
      <p className="text-xs text-teal-700 font-medium text-center">✨ 了解支持方式</p>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setActiveTab('camp')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'camp'
              ? 'bg-teal-500 text-white'
              : 'bg-white text-teal-700 hover:bg-teal-100'
          }`}
        >
          🌱 训练营
        </button>
        <button
          onClick={() => setActiveTab('coach')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'coach'
              ? 'bg-teal-500 text-white'
              : 'bg-white text-teal-700 hover:bg-teal-100'
          }`}
        >
          🧑‍🏫 真人教练
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'camp' ? (
          <motion.div
            key="camp"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-white rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">🌱</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">21天情绪训练营</p>
                <p className="text-xs text-muted-foreground">每天10分钟，建立新习惯</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(21)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex-1 h-2 rounded-full ${
                    i < 7 ? 'bg-teal-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-teal-600 text-center">已完成 7/21 天</p>
          </motion.div>
        ) : (
          <motion.div
            key="coach"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-white rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-lg">🧑‍🏫</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">专业真人教练</p>
                <p className="text-xs text-muted-foreground">1对1深度对话，理清关键问题</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">可选时间段</span>
              <div className="flex gap-1">
                {['上午', '下午', '晚上'].map((time) => (
                  <span key={time} className="px-2 py-1 bg-teal-100 text-teal-700 rounded">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
