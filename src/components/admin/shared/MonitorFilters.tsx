/**
 * 监控平台/时间范围筛选器组件
 */

import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Monitor, Smartphone, MessageCircle, Grid3X3 } from "lucide-react";
import type { MonitorPlatform } from "@/lib/platformDetector";

interface MonitorFiltersProps {
  platform: MonitorPlatform | 'all';
  onPlatformChange: (v: MonitorPlatform | 'all') => void;
  timeRange: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (v: '1h' | '24h' | '7d' | '30d') => void;
  /** 是否显示 "实时" 数据源提示 */
  showRealtimeHint?: boolean;
}

const PLATFORM_OPTIONS: { value: MonitorPlatform | 'all'; label: string; icon: typeof Monitor }[] = [
  { value: 'all', label: '全部', icon: Grid3X3 },
  { value: 'web', label: 'Web', icon: Monitor },
  { value: 'mobile_browser', label: '移动端', icon: Smartphone },
  { value: 'wechat', label: '微信', icon: MessageCircle },
  { value: 'mini_program', label: '小程序', icon: Grid3X3 },
];

const TIME_OPTIONS = [
  { value: '1h', label: '1小时' },
  { value: '24h', label: '24小时' },
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
];

export default function MonitorFilters({
  platform,
  onPlatformChange,
  timeRange,
  onTimeRangeChange,
  showRealtimeHint,
}: MonitorFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">平台:</span>
        <ToggleGroup
          type="single"
          value={platform}
          onValueChange={(v) => v && onPlatformChange(v as MonitorPlatform | 'all')}
          className="gap-0.5"
        >
          {PLATFORM_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="h-7 px-2 text-xs gap-1"
              >
                <Icon className="h-3 w-3" />
                {opt.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">时段:</span>
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={(v) => v && onTimeRangeChange(v as '1h' | '24h' | '7d' | '30d')}
          className="gap-0.5"
        >
          {TIME_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="h-7 px-2.5 text-xs"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {showRealtimeHint && (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          数据来源: 数据库 · 每30秒刷新
        </Badge>
      )}
    </div>
  );
}
