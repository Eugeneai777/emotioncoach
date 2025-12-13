import React from 'react';
import { Signal, SignalLow, SignalMedium, SignalHigh, SignalZero, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NetworkQuality } from '@/hooks/useNetworkQuality';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NetworkQualityIndicatorProps {
  quality: NetworkQuality;
  rtt?: number | null;
  connectionType?: string | null;
  className?: string;
  showLabel?: boolean;
}

const qualityConfig: Record<NetworkQuality, {
  icon: typeof Signal;
  color: string;
  bgColor: string;
  label: string;
  bars: number;
}> = {
  excellent: {
    icon: SignalHigh,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: '网络优秀',
    bars: 4,
  },
  good: {
    icon: SignalMedium,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    label: '网络良好',
    bars: 3,
  },
  fair: {
    icon: SignalLow,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: '网络一般',
    bars: 2,
  },
  poor: {
    icon: SignalZero,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: '网络较差',
    bars: 1,
  },
  unknown: {
    icon: Wifi,
    color: 'text-white/60',
    bgColor: 'bg-white/10',
    label: '检测中...',
    bars: 0,
  },
};

export function NetworkQualityIndicator({
  quality,
  rtt,
  connectionType,
  className,
  showLabel = false,
}: NetworkQualityIndicatorProps) {
  const config = qualityConfig[quality];
  const Icon = config.icon;

  const getTooltipContent = () => {
    const lines = [config.label];
    if (rtt !== null && rtt !== undefined) {
      lines.push(`延迟: ${rtt}ms`);
    }
    if (connectionType) {
      lines.push(`网络: ${connectionType.toUpperCase()}`);
    }
    return lines.join('\n');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full",
            config.bgColor,
            className
          )}>
            {/* Signal bars visualization */}
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    "w-1 rounded-sm transition-all",
                    bar <= config.bars ? config.color.replace('text-', 'bg-') : 'bg-white/20',
                  )}
                  style={{ height: `${bar * 3 + 2}px` }}
                />
              ))}
            </div>
            
            {showLabel && (
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="whitespace-pre-line text-center">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for call UI header
export function NetworkQualityBadge({
  quality,
  rtt,
}: {
  quality: NetworkQuality;
  rtt?: number | null;
}) {
  const config = qualityConfig[quality];

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
      config.bgColor,
      config.color
    )}>
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-0.5 rounded-sm",
              bar <= config.bars ? config.color.replace('text-', 'bg-') : 'bg-white/20',
            )}
            style={{ height: `${bar * 2 + 2}px` }}
          />
        ))}
      </div>
      {rtt !== null && rtt !== undefined && (
        <span>{rtt}ms</span>
      )}
    </div>
  );
}
