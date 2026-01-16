import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MessageSquare, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type NetworkWarningLevel = 'none' | 'slow' | 'unstable' | 'critical';

interface VoiceNetworkWarningProps {
  level: NetworkWarningLevel;
  rtt?: number;
  onSwitchToText?: () => void;
  onDismiss?: () => void;
  onRetry?: () => void;
  isConnecting?: boolean;
  className?: string;
}

const getWarningConfig = (level: NetworkWarningLevel, rtt?: number) => {
  switch (level) {
    case 'slow':
      return {
        title: '网络连接较慢',
        description: `当前延迟 ${rtt || '--'}ms，可能影响语音体验`,
        color: 'yellow',
        icon: AlertTriangle,
        showTextSwitch: false,
      };
    case 'unstable':
      return {
        title: '网络不稳定',
        description: '语音可能出现延迟或中断',
        color: 'orange',
        icon: AlertTriangle,
        showTextSwitch: true,
      };
    case 'critical':
      return {
        title: '网络连接困难',
        description: '建议切换到文字对话',
        color: 'red',
        icon: AlertTriangle,
        showTextSwitch: true,
      };
    default:
      return null;
  }
};

export const VoiceNetworkWarning = ({
  level,
  rtt,
  onSwitchToText,
  onDismiss,
  onRetry,
  isConnecting = false,
  className,
}: VoiceNetworkWarningProps) => {
  const config = getWarningConfig(level, rtt);

  if (!config || level === 'none') return null;

  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-500',
    },
    orange: {
      bg: 'bg-orange-500/10 border-orange-500/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-500',
    },
    red: {
      bg: 'bg-red-500/10 border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={cn(
          "relative flex flex-col gap-2 p-3 rounded-xl border",
          colors.bg,
          className
        )}
      >
        {/* 关闭按钮 */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}

        {/* 警告内容 */}
        <div className="flex items-start gap-2 pr-6">
          <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", colors.icon)} />
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-sm font-medium", colors.text)}>
              {config.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {config.description}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        {(config.showTextSwitch || isConnecting) && (
          <div className="flex items-center gap-2 mt-1">
            {config.showTextSwitch && onSwitchToText && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={onSwitchToText}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                切换文字聊天
              </Button>
            )}
            {isConnecting && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1.5"
                onClick={onRetry}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重试
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// 简洁的通话中弱网提示条
export const InCallNetworkHint = ({
  level,
  rtt,
  onDismiss,
}: {
  level: NetworkWarningLevel;
  rtt?: number;
  onDismiss?: () => void;
}) => {
  if (level === 'none') return null;

  const isWarning = level === 'slow';
  const isCritical = level === 'unstable' || level === 'critical';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-lg",
          isWarning && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          isCritical && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
        )}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {level === 'slow' && `网络延迟 ${rtt || '--'}ms`}
            {level === 'unstable' && '网络不稳定'}
            {level === 'critical' && '网络连接困难'}
          </span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-0.5 hover:bg-background/50 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
