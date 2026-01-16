import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mic, Cloud, Zap, Check, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConnectionPhase = 
  | 'preparing'      // 检查配额
  | 'requesting_mic' // 请求麦克风权限
  | 'getting_token'  // 获取服务器 token
  | 'establishing'   // 建立 WebRTC/WebSocket 连接
  | 'connected';     // 已连接

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

interface ConnectionProgressProps {
  phase: ConnectionPhase;
  networkQuality?: NetworkQuality;
  rtt?: number;
  elapsedTime?: number;
  usingFallback?: boolean; // 是否正在使用备用通道
}

const PHASES: { key: ConnectionPhase; label: string; icon: typeof Shield }[] = [
  { key: 'preparing', label: '准备中', icon: Shield },
  { key: 'requesting_mic', label: '麦克风', icon: Mic },
  { key: 'getting_token', label: '连接服务器', icon: Cloud },
  { key: 'establishing', label: '建立通道', icon: Zap },
  { key: 'connected', label: '已连接', icon: Check },
];

const getPhaseIndex = (phase: ConnectionPhase): number => {
  return PHASES.findIndex(p => p.key === phase);
};

const getNetworkQualityInfo = (quality: NetworkQuality, rtt?: number) => {
  switch (quality) {
    case 'excellent':
      return { label: '网络极佳', color: 'text-green-500', bgColor: 'bg-green-500' };
    case 'good':
      return { label: '网络良好', color: 'text-green-400', bgColor: 'bg-green-400' };
    case 'fair':
      return { label: '网络一般', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
    case 'poor':
      return { label: '网络较差', color: 'text-red-500', bgColor: 'bg-red-500' };
    default:
      return { label: '检测中', color: 'text-muted-foreground', bgColor: 'bg-muted-foreground' };
  }
};

export const ConnectionProgress = ({
  phase,
  networkQuality = 'unknown',
  rtt,
  elapsedTime = 0,
  usingFallback = false,
}: ConnectionProgressProps) => {
  const currentIndex = getPhaseIndex(phase);
  const networkInfo = getNetworkQualityInfo(networkQuality, rtt);

  return (
    <div className="flex flex-col items-center gap-4 p-6 min-h-[200px]">
      {/* 进度指示器 */}
      <div className="flex items-center gap-1 w-full max-w-xs">
        {PHASES.map((phaseInfo, index) => {
          const Icon = phaseInfo.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={phaseInfo.key} className="flex-1 flex flex-col items-center gap-1">
              {/* 图标 */}
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-green-500 text-white",
                  isActive && "bg-primary text-primary-foreground",
                  isPending && "bg-muted text-muted-foreground"
                )}
                animate={isActive ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: ['0 0 0 0 rgba(var(--primary), 0.4)', '0 0 0 8px rgba(var(--primary), 0)', '0 0 0 0 rgba(var(--primary), 0)']
                } : {}}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              
              {/* 连接线 */}
              {index < PHASES.length - 1 && (
                <div className="h-0.5 w-full absolute left-1/2 top-4 hidden" />
              )}
              
              {/* 标签 - 仅显示当前阶段 */}
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-muted-foreground whitespace-nowrap"
                >
                  {phaseInfo.label}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentIndex + 1) / PHASES.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 状态信息 */}
      <div className="flex flex-col items-center gap-2 text-center">
        {phase === 'connected' ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-green-500"
          >
            <Check className="w-5 h-5" />
            <span className="font-medium">连接成功</span>
          </motion.div>
        ) : (
          <>
            {/* 当前阶段描述 */}
            <motion.p
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              {phase === 'preparing' && '正在检查账户状态...'}
              {phase === 'requesting_mic' && '请允许麦克风权限...'}
              {phase === 'getting_token' && '正在连接语音服务器...'}
              {phase === 'establishing' && (usingFallback ? '正在使用备用通道...' : '正在建立语音通道...')}
            </motion.p>

            {/* 等待时间 */}
            {elapsedTime > 0 && (
              <span className="text-xs text-muted-foreground/70">
                已等待 {elapsedTime} 秒
              </span>
            )}
          </>
        )}
      </div>

      {/* 网络状态指示 */}
      <AnimatePresence>
        {(networkQuality !== 'unknown' || rtt !== undefined) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
              "bg-muted/50"
            )}
          >
            {networkQuality === 'poor' ? (
              <WifiOff className={cn("w-3.5 h-3.5", networkInfo.color)} />
            ) : (
              <Wifi className={cn("w-3.5 h-3.5", networkInfo.color)} />
            )}
            <span className={networkInfo.color}>{networkInfo.label}</span>
            {rtt !== undefined && (
              <span className="text-muted-foreground">
                {rtt}ms
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 弱网警告 */}
      <AnimatePresence>
        {networkQuality === 'poor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              网络不稳定，可能影响通话质量
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 紧凑版连接状态指示器 - 用于通话中显示
export const ConnectionStatusBadge = ({
  networkQuality = 'unknown',
  rtt,
  usingFallback = false,
}: {
  networkQuality?: NetworkQuality;
  rtt?: number;
  usingFallback?: boolean;
}) => {
  const networkInfo = getNetworkQualityInfo(networkQuality, rtt);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs">
      {/* 网络信号条 */}
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => {
          const threshold = networkQuality === 'excellent' ? 4 : 
                           networkQuality === 'good' ? 3 : 
                           networkQuality === 'fair' ? 2 : 
                           networkQuality === 'poor' ? 1 : 0;
          const isActive = bar <= threshold;
          return (
            <div
              key={bar}
              className={cn(
                "w-1 rounded-sm transition-colors",
                isActive ? networkInfo.bgColor : "bg-muted"
              )}
              style={{ height: `${bar * 3}px` }}
            />
          );
        })}
      </div>

      {/* RTT 显示 */}
      {rtt !== undefined && (
        <span className={cn("tabular-nums", networkInfo.color)}>
          {rtt}ms
        </span>
      )}

      {/* 备用通道标识 */}
      {usingFallback && (
        <span className="text-muted-foreground">备用</span>
      )}
    </div>
  );
};
