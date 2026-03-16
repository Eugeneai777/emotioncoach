import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Phone, MessageCircle, RotateCcw, Heart, History, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";
import AmbientSoundPlayer from "./panic/AmbientSoundPlayer";
import ModeSelector from "./panic/ModeSelector";
import SessionSummaryCard from "./panic/SessionSummaryCard";
import { EmotionType, REMINDERS_PER_CYCLE, getStageConfig } from "@/config/emotionReliefConfig";
import { useFreeTrialTracking } from "@/hooks/useFreeTrialTracking";
import EmotionButtonPurchaseDialog from "@/components/conversion/EmotionButtonPurchaseDialog";

interface EmotionReliefFlowProps {
  emotionType: EmotionType;
  onClose: () => void;
  autoOpenPurchase?: boolean;
}

type FlowStep = 'mode-select' | 'breathing' | 'cognitive' | 'checkin' | 'complete';
type StartMode = 'cognitive' | 'breathing';

const EmotionReliefFlow: React.FC<EmotionReliefFlowProps> = ({ emotionType, onClose, autoOpenPurchase }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<FlowStep>('mode-select');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const [showReminderAnimation, setShowReminderAnimation] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(!!autoOpenPurchase);

  // 支付授权回跳后：当父组件稍后把 autoOpenPurchase 置为 true 时，同步拉起购买弹窗
  useEffect(() => {
    if (autoOpenPurchase) {
      setShowPurchaseDialog(true);
    }
  }, [autoOpenPurchase]);
  
  // 免费试用追踪
  const { usageCount, freeLimit, isLimitReached, remainingFree, incrementUsage, trackEvent } = useFreeTrialTracking({
    featureKey: 'emotion_button',
    defaultLimit: 5,
  });
  
  // 会话追踪
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  const remindersViewedRef = useRef(0);
  const breathingCompletedRef = useRef(false);
  const breathingFromCompleteRef = useRef(false);

  // 获取当前阶段配置
  const stageConfig = getStageConfig(emotionType, currentReminderIndex);

  // 创建会话记录
  const createSession = useCallback(async () => {
    if (!user?.id) return;
    
    startTimeRef.current = new Date();
    
    const { data, error } = await supabase
      .from('panic_sessions')
      .insert({
        user_id: user.id,
        started_at: startTimeRef.current.toISOString(),
        emotion_type: emotionType.id,
      })
      .select('id')
      .single();
    
    if (!error && data) {
      sessionIdRef.current = data.id;
    }
  }, [user?.id, emotionType.id]);

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

  // 撒花动画
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#14b8a6', '#06b6d4', '#3b82f6', '#22c55e'],
      disableForReducedMotion: true,
    });
  }, []);

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

  // 提醒切换时的动画
  useEffect(() => {
    setShowReminderAnimation(true);
    const timer = setTimeout(() => setShowReminderAnimation(false), 400);
    return () => clearTimeout(timer);
  }, [currentReminderIndex]);

  // 选择模式
  const handleSelectMode = async (mode: StartMode) => {
    // 增加使用次数
    const newCount = await incrementUsage();
    
    // 检查是否超过免费次数（但不阻断）
    if (newCount > freeLimit) {
      trackEvent('purchase_dialog_shown');
      setShowPurchaseDialog(true);
    }
    
    await createSession();
    if (mode === 'breathing') {
      setStep('breathing');
    } else {
      setStep('cognitive');
    }
  };

  // 下一条提醒
  const handleNextReminder = () => {
    remindersViewedRef.current += 1;
    const nextIndex = currentReminderIndex + 1;
    
    if (nextIndex % REMINDERS_PER_CYCLE === 0) {
      setStep('checkin');
    } else if (nextIndex < emotionType.reminders.length) {
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
    const nextIndex = currentReminderIndex + 1;
    
    if (nextIndex >= emotionType.reminders.length) {
      setCurrentReminderIndex(0);
      setCycleCount(c => c + 1);
    } else {
      setCurrentReminderIndex(nextIndex);
    }
  };

  // 用户选择好了
  const handleFeelBetter = async () => {
    await updateSession('feel_better');
    triggerConfetti();
    setStep('complete');
  };

  // 处理关闭
  const handleClose = async () => {
    if (sessionIdRef.current && step !== 'complete') {
      await updateSession('exited');
    }
    onClose();
  };

  // 快捷切换到呼吸
  const handleQuickBreathing = () => {
    setStep('breathing');
    setBreathCount(0);
    setBreathPhase('inhale');
    setBreathTimer(4);
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

  const getSessionDuration = () => {
    return Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
  };

  // 根据情绪类型获取渐变色类名
  const getGradientClasses = () => {
    return `bg-gradient-to-b ${emotionType.bgGradient}`;
  };

  const getButtonGradient = () => {
    return `bg-gradient-to-r ${emotionType.gradient}`;
  };

  return (
    <div className={`fixed inset-0 z-50 ${getGradientClasses()} flex flex-col`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-60 h-60 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-white/15 rounded-full blur-3xl" />
      </div>

      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-700 hover:bg-white/30"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </Button>
        
        {(step === 'cognitive' || step === 'breathing') && (
          <AmbientSoundPlayer isActive={step === 'cognitive' || step === 'breathing'} />
        )}
        
        {user && step !== 'mode-select' && (
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-700 hover:bg-white/30"
            onClick={() => {
              handleClose();
              navigate('/panic-history');
            }}
          >
            <History className="w-6 h-6" />
          </Button>
        )}
        
        {(!user || step === 'mode-select') && <div className="w-10" />}
      </div>

      {/* 模式选择 */}
      {step === 'mode-select' && (
        <ModeSelector 
          onSelectMode={handleSelectMode} 
          emotionType={emotionType}
          remainingFree={remainingFree}
          freeLimit={freeLimit}
        />
      )}

      {/* 购买引导弹窗 */}
      <EmotionButtonPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        usageCount={usageCount}
        onTrackEvent={trackEvent}
        autoOpenPay={!!autoOpenPurchase}
      />

      {/* 呼吸引导 */}
      {step === 'breathing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <p className="text-slate-600/70 mb-8">跟着节奏呼吸</p>
          
          <div 
            className={`w-48 h-48 rounded-full ${getButtonGradient()}
              flex items-center justify-center transition-transform duration-1000 ease-in-out shadow-lg ${getBreathScale()}`}
          >
            <div className="text-center text-white">
              <div className="text-3xl font-medium">{getBreathInstruction()}</div>
              <div className="text-5xl font-bold mt-2">{breathTimer}</div>
            </div>
          </div>
          
          <div className="mt-8 text-slate-600/70">
            第 {breathCount + 1} / 3 次
          </div>
          
          <p className="mt-8 text-slate-700/60 text-center max-w-xs">
            4秒吸气 - 7秒屏住 - 8秒呼气
          </p>
        </div>
      )}

      {/* 认知提醒 */}
      {step === 'cognitive' && (
        <div className="flex-1 flex flex-col items-center p-6 relative z-10">
          {/* 提醒卡片 */}
          <div className="flex-1 flex items-center justify-center px-4 w-full">
            <div 
              className={`bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border-2 max-w-md w-full transition-all duration-300 ${stageConfig.borderClass} ${
                showReminderAnimation ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              <p className="text-xl md:text-2xl font-medium text-slate-800 text-center leading-relaxed">
                {emotionType.reminders[currentReminderIndex]}
              </p>
            </div>
          </div>
          
          {/* 底部操作区 */}
          <div className="w-full max-w-md space-y-4">
            {/* 快捷工具栏 */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full hover:bg-white/30"
                onClick={handleQuickBreathing}
                title="切换到呼吸"
              >
                <Wind className="w-6 h-6 text-slate-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-slate-500/60 hover:bg-white/30"
                onClick={() => setStep('checkin')}
              >
                跳过询问
              </Button>
            </div>
            
            {/* 下一条按钮 */}
            <div className="flex items-center gap-4">
              <div className="text-slate-400 text-2xl">∞</div>
              <Button
                className={`flex-1 h-14 ${getButtonGradient()} hover:opacity-90 text-white rounded-full shadow-lg`}
                onClick={handleNextReminder}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            
            <p className="text-slate-500/60 text-sm text-center">
              本轮 {(currentReminderIndex % REMINDERS_PER_CYCLE) + 1} / {REMINDERS_PER_CYCLE}
            </p>
          </div>
        </div>
      )}

      {/* 询问界面 */}
      {step === 'checkin' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="text-5xl mb-8">{emotionType.emoji}</div>
          <h2 className="text-2xl font-medium text-slate-800 text-center mb-4">
            你现在感觉怎么样？
          </h2>
          <p className="text-slate-600/70 text-center mb-12">
            {emotionType.title}离开你了吗？
          </p>
          
          <div className="flex gap-4 w-full max-w-md">
            <Button
              className={`flex-1 h-14 ${getButtonGradient()} hover:opacity-90 text-white rounded-full text-lg shadow-lg`}
              onClick={handleContinue}
            >
              还需要陪伴
            </Button>
            <Button
              className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg shadow-lg"
              onClick={handleFeelBetter}
            >
              我好多了
            </Button>
          </div>
        </div>
      )}

      {/* 完成界面 */}
      {step === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 overflow-y-auto">
          <div className="text-5xl mb-4">🌊</div>
          <h2 className="text-2xl font-medium text-slate-800 text-center mb-2">
            你做得很好
          </h2>
          <p className="text-slate-600/70 text-center mb-6 max-w-xs">
            {emotionType.title}会离开你，而你会留下来。你已经证明了自己的力量。
          </p>
          
          <SessionSummaryCard
            durationSeconds={getSessionDuration()}
            remindersViewed={remindersViewedRef.current}
            cyclesCompleted={cycleCount}
            breathingCompleted={breathingCompletedRef.current}
          />
          
          <div className="w-full max-w-sm space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-2 border-slate-200 text-slate-700 hover:bg-white/50 gap-2"
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
              className="w-full h-12 rounded-full border-2 border-slate-200 text-slate-700 hover:bg-white/50 gap-2"
              onClick={() => {
                onClose();
                navigate('/');
              }}
            >
              <MessageCircle className="w-4 h-4" />
              和情绪觉醒教练聊聊
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 rounded-full border-2 border-slate-200 text-slate-700 hover:bg-white/50 gap-2"
              onClick={() => window.open('tel:400-161-9995')}
            >
              <Phone className="w-4 h-4" />
              24小时心理援助热线
            </Button>

            {user && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-full border-2 border-slate-200 text-slate-700 hover:bg-white/50 gap-2"
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
              className={`w-full h-12 ${getButtonGradient()} hover:opacity-90 text-white rounded-full gap-2 shadow-lg`}
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

export default EmotionReliefFlow;
