import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AwakeningStatusBarProps {
  currentScore: number; // 当前觉醒分数 0-100
}

// 4个觉醒状态定义
const awakeningStates = [
  {
    id: 'starting',
    emoji: '🔴',
    label: '觉醒起步',
    description: '刚刚开始，需要持续练习',
    minScore: 0,
    maxScore: 39,
    color: 'bg-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50',
  },
  {
    id: 'initial',
    emoji: '🟠',
    label: '初步觉醒',
    description: '开始看见改变，意识正在觉醒',
    minScore: 40,
    maxScore: 59,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/50',
  },
  {
    id: 'steady',
    emoji: '🟡',
    label: '稳步觉醒',
    description: '持续突破中，正在建立新模式',
    minScore: 60,
    maxScore: 79,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/50',
  },
  {
    id: 'high',
    emoji: '🟢',
    label: '高度觉醒',
    description: '财富能量畅通，与金钱和谐共处',
    minScore: 80,
    maxScore: 100,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50',
  },
];

const AwakeningStatusBar: React.FC<AwakeningStatusBarProps> = ({ currentScore }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // 确定当前状态
  const getCurrentState = () => {
    for (const state of awakeningStates) {
      if (currentScore >= state.minScore && currentScore <= state.maxScore) {
        return state;
      }
    }
    return awakeningStates[0];
  };
  
  const currentState = getCurrentState();
  
  // 计算距离下一状态的分数
  const getNextStateInfo = () => {
    const currentIndex = awakeningStates.findIndex(s => s.id === currentState.id);
    if (currentIndex >= awakeningStates.length - 1) {
      return { nextState: null, pointsNeeded: 0 };
    }
    const nextState = awakeningStates[currentIndex + 1];
    const pointsNeeded = nextState.minScore - currentScore;
    return { nextState, pointsNeeded };
  };
  
  const { nextState, pointsNeeded } = getNextStateInfo();
  
  // 计算指针位置百分比
  const getPointerPosition = () => {
    // 每个状态占 25%
    const stateIndex = awakeningStates.findIndex(s => s.id === currentState.id);
    const stateWidth = 25;
    const stateStart = stateIndex * stateWidth;
    
    // 在当前状态内的相对位置
    const stateRange = currentState.maxScore - currentState.minScore;
    const positionInState = (currentScore - currentState.minScore) / stateRange;
    
    return stateStart + (positionInState * stateWidth);
  };
  
  const pointerPosition = getPointerPosition();

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div 
        className="w-full space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* 状态进度条 */}
        <div className="relative">
          {/* 4段式进度条 */}
          <div className="flex h-7 sm:h-8 rounded-lg overflow-hidden border border-slate-700">
            {awakeningStates.map((state, index) => {
              const isCurrentState = state.id === currentState.id;
              const isHovered = hoveredState === state.id;
              
              return (
                <Tooltip key={state.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className={`
                        flex-1 flex items-center justify-center cursor-pointer
                        transition-all duration-300 relative
                        ${isCurrentState ? `${state.bgColor} border-2 ${state.borderColor}` : 'bg-slate-800/50'}
                        ${isHovered && !isCurrentState ? 'bg-slate-700/50' : ''}
                      `}
                      onMouseEnter={() => setHoveredState(state.id)}
                      onMouseLeave={() => setHoveredState(null)}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* 当前状态的发光效果 */}
                      {isCurrentState && (
                        <motion.div
                          className={`absolute inset-0 ${state.bgColor} opacity-30`}
                          animate={{ opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <div className="flex flex-col items-center z-10">
                        <span className="text-sm sm:text-base">{state.emoji}</span>
                        {/* 分数范围 - 仅在 sm 及以上显示 */}
                        <span className={`hidden sm:block text-[10px] ${isCurrentState ? 'text-white font-medium' : 'text-slate-500'}`}>
                          {state.minScore}-{state.maxScore === 100 ? '100' : state.maxScore}
                        </span>
                      </div>
                      
                      {/* 分隔线 */}
                      {index < awakeningStates.length - 1 && (
                        <div className="absolute right-0 top-1 bottom-1 w-px bg-slate-600" />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-slate-800 border-slate-700 max-w-[200px]"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 font-medium">
                        {state.emoji} {state.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {state.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        分数区间: {state.minScore}-{state.maxScore}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          
          {/* 动态指针 */}
          <motion.div
            className="absolute -bottom-2 flex flex-col items-center"
            style={{ left: `${pointerPosition}%`, transform: 'translateX(-50%)' }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            <div className="text-amber-400 text-lg">▲</div>
          </motion.div>
        </div>
        
        {/* 当前状态和目标 - 移动端堆叠 */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs pt-2 gap-1 sm:gap-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${currentState.bgColor} ${currentState.borderColor} border`}>
              {currentState.emoji}
              <span className="text-white font-medium">{currentState.label}</span>
            </span>
            <span className="text-slate-400">· {currentScore}分</span>
          </div>
          
          {nextState ? (
            <motion.span 
              className="text-slate-400 text-left sm:text-right"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              距 <span className="text-amber-400 font-medium">{nextState.label}</span> 还差 
              <span className="text-amber-400 font-bold mx-0.5">{pointsNeeded}</span>分
            </motion.span>
          ) : (
            <span className="text-emerald-400 font-medium">
              🎉 已达成高度觉醒
            </span>
          )}
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
};

export default AwakeningStatusBar;
