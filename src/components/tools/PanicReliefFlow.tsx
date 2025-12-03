import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Volume2, VolumeX, ChevronRight, Phone, MessageCircle, RotateCcw, Heart } from "lucide-react";
import { cognitiveReminders, REMINDERS_PER_CYCLE } from "@/config/cognitiveReminders";
import { useNavigate } from "react-router-dom";

interface PanicReliefFlowProps {
  onClose: () => void;
}

type FlowStep = 'initial' | 'breathing' | 'cognitive' | 'checkin' | 'complete';

const PanicReliefFlow: React.FC<PanicReliefFlowProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('initial');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cycleCount, setCycleCount] = useState(1);

  // 呼吸引导逻辑
  useEffect(() => {
    if (step !== 'breathing') return;

    const timer = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          // 切换呼吸阶段
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 8;
          } else {
            // 完成一个循环
            const newCount = breathCount + 1;
            setBreathCount(newCount);
            if (newCount >= 3) {
              // 完成3个循环，进入认知提醒
              setStep('cognitive');
              return 0;
            }
            setBreathPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, breathPhase, breathCount]);

  // 语音朗读
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // 下一条提醒
  const handleNextReminder = () => {
    const nextIndex = currentReminderIndex + 1;
    
    // 每8条后显示询问
    if (nextIndex % REMINDERS_PER_CYCLE === 0) {
      setStep('checkin');
    } else if (nextIndex < cognitiveReminders.length) {
      setCurrentReminderIndex(nextIndex);
    } else {
      // 完成所有32条，循环回第1条
      setCurrentReminderIndex(0);
      setCycleCount(c => c + 1);
      setStep('checkin');
    }
  };

  // 用户选择继续
  const handleContinue = () => {
    setStep('cognitive');
    // 如果已经完成所有提醒，从头开始
    if (currentReminderIndex >= cognitiveReminders.length - 1) {
      setCurrentReminderIndex(0);
    }
  };

  // 用户选择好了
  const handleFeelBetter = () => {
    stopSpeaking();
    setStep('complete');
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return '吸气';
      case 'hold': return '屏住';
      case 'exhale': return '呼气';
    }
  };

  const getBreathScale = () => {
    switch (breathPhase) {
      case 'inhale': return 'scale-110';
      case 'hold': return 'scale-110';
      case 'exhale': return 'scale-90';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-sky-100 to-sky-200 flex flex-col">
      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 text-slate-600"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* 初始界面 */}
      {step === 'initial' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-6">💚</div>
          <h1 className="text-2xl font-medium text-slate-700 text-center mb-4">
            你很安全，我在这里
          </h1>
          <p className="text-slate-500 text-center mb-12">
            让我们一起度过这个时刻
          </p>
          
          <div className="w-full max-w-sm space-y-4">
            <Button
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg"
              onClick={() => setStep('breathing')}
            >
              帮帮我
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 rounded-full text-lg border-slate-300"
              onClick={handleFeelBetter}
            >
              我有信心自己可以
            </Button>
          </div>
        </div>
      )}

      {/* 呼吸引导 */}
      {step === 'breathing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-slate-500 mb-8">跟着节奏呼吸</p>
          
          {/* 呼吸圆圈 */}
          <div 
            className={`w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 
              flex items-center justify-center transition-transform duration-1000 ease-in-out ${getBreathScale()}`}
          >
            <div className="text-center text-white">
              <div className="text-3xl font-medium">{getBreathInstruction()}</div>
              <div className="text-5xl font-bold mt-2">{breathTimer}</div>
            </div>
          </div>
          
          <div className="mt-8 text-slate-500">
            第 {breathCount + 1} / 3 次
          </div>
          
          <p className="mt-8 text-slate-600 text-center max-w-xs">
            4秒吸气 - 7秒屏住 - 8秒呼气
          </p>
        </div>
      )}

      {/* 认知提醒 */}
      {step === 'cognitive' && (
        <div className="flex-1 flex flex-col items-center p-6">
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xl md:text-2xl font-medium text-slate-700 text-center leading-relaxed">
              {cognitiveReminders[currentReminderIndex]}
            </p>
          </div>
          
          {/* 语音播放按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="mb-8 w-16 h-16"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speakText(cognitiveReminders[currentReminderIndex]);
              }
            }}
          >
            {isSpeaking ? (
              <VolumeX className="w-10 h-10 text-slate-600" />
            ) : (
              <Volume2 className="w-10 h-10 text-slate-600" />
            )}
          </Button>
          
          {/* 继续按钮 */}
          <div className="flex items-center gap-4 w-full max-w-md mb-8">
            <div className="text-slate-400 text-2xl">∞</div>
            <Button
              className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
              onClick={handleNextReminder}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          {/* 进度指示 */}
          <p className="text-slate-400 text-sm">
            {(currentReminderIndex % REMINDERS_PER_CYCLE) + 1} / {REMINDERS_PER_CYCLE}
          </p>
        </div>
      )}

      {/* 询问界面 */}
      {step === 'checkin' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-5xl mb-8">🌿</div>
          <h2 className="text-2xl font-medium text-slate-700 text-center mb-4">
            你现在感觉如何？
          </h2>
          <p className="text-slate-500 text-center mb-12">
            恐慌结束了吗？
          </p>
          
          <div className="flex gap-4 w-full max-w-md">
            <Button
              className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg"
              onClick={handleContinue}
            >
              没有
            </Button>
            <Button
              className="flex-1 h-14 bg-amber-400 hover:bg-amber-500 text-white rounded-full text-lg"
              onClick={handleFeelBetter}
            >
              是的
            </Button>
          </div>
          
          {cycleCount > 1 && (
            <p className="mt-6 text-slate-400 text-sm">
              已完成 {cycleCount - 1} 轮提醒
            </p>
          )}
        </div>
      )}

      {/* 完成界面 */}
      {step === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-5xl mb-6">💚</div>
          <h2 className="text-2xl font-medium text-slate-700 text-center mb-4">
            你做得很好
          </h2>
          <p className="text-slate-500 text-center mb-12 max-w-xs">
            恐慌会离开你，而你会留下来。你已经证明了自己的力量。
          </p>
          
          <div className="w-full max-w-sm space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-slate-300 gap-2"
              onClick={() => {
                setStep('breathing');
                setBreathCount(0);
                setBreathPhase('inhale');
                setBreathTimer(4);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              再来一轮呼吸
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-slate-300 gap-2"
              onClick={() => {
                onClose();
                navigate('/');
              }}
            >
              <MessageCircle className="w-4 h-4" />
              和劲老师聊聊
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-slate-300 gap-2"
              onClick={() => window.open('tel:400-161-9995')}
            >
              <Phone className="w-4 h-4" />
              24小时心理援助热线
            </Button>
            
            <Button
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full gap-2"
              onClick={onClose}
            >
              <Heart className="w-4 h-4" />
              我好多了
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanicReliefFlow;
