import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, ChevronRight, Phone, MessageCircle, RotateCcw, Heart, History } from "lucide-react";
import { cognitiveReminders, REMINDERS_PER_CYCLE } from "@/config/cognitiveReminders";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PanicReliefFlowProps {
  onClose: () => void;
}

type FlowStep = 'breathing' | 'cognitive' | 'checkin' | 'complete';

const PanicReliefFlow: React.FC<PanicReliefFlowProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<FlowStep>('cognitive');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cycleCount, setCycleCount] = useState(1);
  
  // 会话追踪
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  const remindersViewedRef = useRef(0);
  const breathingCompletedRef = useRef(false);
  const breathingFromCompleteRef = useRef(false);

  // 创建会话记录
  const createSession = useCallback(async () => {
    if (!user?.id) return;
    
    startTimeRef.current = new Date();
    
    const { data, error } = await supabase
      .from('panic_sessions')
      .insert({
        user_id: user.id,
        started_at: startTimeRef.current.toISOString(),
      })
      .select('id')
      .single();
    
    if (!error && data) {
      sessionIdRef.current = data.id;
    }
  }, [user?.id]);

  // 更新会话记录
  const updateSession = useCallback(async (outcome: string) => {
    if (!sessionIdRef.current || !user?.id) return;
    
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
    
    await supabase
      .from('panic_sessions')
      .update({
        ended_at: endTime.toISOString(),
        duration_seconds: durationSeconds,
        reminders_viewed: remindersViewedRef.current,
        cycles_completed: cycleCount,
        breathing_completed: breathingCompletedRef.current,
        outcome
      })
      .eq('id', sessionIdRef.current);
  }, [user?.id, cycleCount]);

  // 开始会话 - 组件挂载时立即创建
  useEffect(() => {
    createSession();
  }, [createSession]);

  // 呼吸引导逻辑
  useEffect(() => {
    if (step !== 'breathing') return;

    const timer = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 8;
          } else {
            const newCount = breathCount + 1;
            setBreathCount(newCount);
            if (newCount >= 3) {
              breathingCompletedRef.current = true;
              // 如果从完成界面进入，返回完成界面
              if (breathingFromCompleteRef.current) {
                breathingFromCompleteRef.current = false;
                setStep('complete');
              } else {
                setStep('cognitive');
              }
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
    remindersViewedRef.current += 1;
    const nextIndex = currentReminderIndex + 1;
    
    if (nextIndex % REMINDERS_PER_CYCLE === 0) {
      setStep('checkin');
    } else if (nextIndex < cognitiveReminders.length) {
      setCurrentReminderIndex(nextIndex);
    } else {
      setCurrentReminderIndex(0);
      setCycleCount(c => c + 1);
      setStep('checkin');
    }
  };

  // 用户选择继续
  const handleContinue = () => {
    setStep('cognitive');
    if (currentReminderIndex >= cognitiveReminders.length - 1) {
      setCurrentReminderIndex(0);
    }
  };

  // 用户选择好了
  const handleFeelBetter = async () => {
    stopSpeaking();
    await updateSession('feel_better');
    setStep('complete');
  };

  // 处理关闭
  const handleClose = async () => {
    stopSpeaking();
    if (sessionIdRef.current && step !== 'complete') {
      await updateSession('exited');
    }
    onClose();
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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-60 h-60 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-blue-200/15 rounded-full blur-3xl" />
      </div>

      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 text-teal-700 hover:bg-teal-100/50"
        onClick={handleClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* 历史记录按钮 */}
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-teal-700 hover:bg-teal-100/50"
          onClick={() => {
            handleClose();
            navigate('/panic-history');
          }}
        >
          <History className="w-6 h-6" />
        </Button>
      )}

      {/* 呼吸引导 */}
      {step === 'breathing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <p className="text-teal-600/70 mb-8">跟着节奏呼吸</p>
          
          <div 
            className={`w-48 h-48 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 
              flex items-center justify-center transition-transform duration-1000 ease-in-out shadow-lg shadow-teal-200/50 ${getBreathScale()}`}
          >
            <div className="text-center text-white">
              <div className="text-3xl font-medium">{getBreathInstruction()}</div>
              <div className="text-5xl font-bold mt-2">{breathTimer}</div>
            </div>
          </div>
          
          <div className="mt-8 text-teal-600/70">
            第 {breathCount + 1} / 3 次
          </div>
          
          <p className="mt-8 text-teal-700/60 text-center max-w-xs">
            4秒吸气 - 7秒屏住 - 8秒呼气
          </p>
        </div>
      )}

      {/* 认知提醒 */}
      {step === 'cognitive' && (
        <div className="flex-1 flex flex-col items-center p-6 relative z-10">
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-teal-100/50 max-w-md">
              <p className="text-xl md:text-2xl font-medium text-teal-800 text-center leading-relaxed">
                {cognitiveReminders[currentReminderIndex]}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="mb-8 w-16 h-16 hover:bg-teal-100/50"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speakText(cognitiveReminders[currentReminderIndex]);
              }
            }}
          >
            {isSpeaking ? (
              <VolumeX className="w-10 h-10 text-teal-600" />
            ) : (
              <Volume2 className="w-10 h-10 text-teal-600" />
            )}
          </Button>
          
          <div className="flex items-center gap-4 w-full max-w-md mb-8">
            <div className="text-teal-400 text-2xl">∞</div>
            <Button
              className="flex-1 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-full shadow-lg shadow-teal-200/50"
              onClick={handleNextReminder}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          <p className="text-teal-500/60 text-sm">
            {(currentReminderIndex % REMINDERS_PER_CYCLE) + 1} / {REMINDERS_PER_CYCLE}
          </p>
        </div>
      )}

      {/* 询问界面 */}
      {step === 'checkin' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="text-5xl mb-8">🌿</div>
          <h2 className="text-2xl font-medium text-teal-800 text-center mb-4">
            你现在感觉如何？
          </h2>
          <p className="text-teal-600/70 text-center mb-12">
            恐慌结束了吗？
          </p>
          
          <div className="flex gap-4 w-full max-w-md">
            <Button
              className="flex-1 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-full text-lg shadow-lg shadow-teal-200/50"
              onClick={handleContinue}
            >
              没有
            </Button>
            <Button
              className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg shadow-lg shadow-emerald-200/50"
              onClick={handleFeelBetter}
            >
              是的
            </Button>
          </div>
          
          {cycleCount > 1 && (
            <p className="mt-6 text-teal-500/60 text-sm">
              已完成 {cycleCount - 1} 轮提醒
            </p>
          )}
        </div>
      )}

      {/* 完成界面 */}
      {step === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="text-5xl mb-6">🌊</div>
          <h2 className="text-2xl font-medium text-teal-800 text-center mb-4">
            你做得很好
          </h2>
          <p className="text-teal-600/70 text-center mb-12 max-w-xs">
            恐慌会离开你，而你会留下来。你已经证明了自己的力量。
          </p>
          
          <div className="w-full max-w-sm space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
              onClick={() => {
                breathingFromCompleteRef.current = true;
                setStep('breathing');
                setBreathCount(0);
                setBreathPhase('inhale');
                setBreathTimer(4);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              做呼吸练习
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
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
              className="w-full h-12 rounded-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
              onClick={() => window.open('tel:400-161-9995')}
            >
              <Phone className="w-4 h-4" />
              24小时心理援助热线
            </Button>

            {user && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
                onClick={() => {
                  onClose();
                  navigate('/panic-history');
                }}
              >
                <History className="w-4 h-4" />
                查看历史记录
              </Button>
            )}
            
            <Button
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-full gap-2 shadow-lg shadow-teal-200/50"
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
