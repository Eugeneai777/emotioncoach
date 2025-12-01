import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Globe, Clock } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { zhCN } from "date-fns/locale";

// 常用时区列表
export const COMMON_TIMEZONES = [
  { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)", region: "亚洲" },
  { value: "Asia/Hong_Kong", label: "香港时间 (UTC+8)", region: "亚洲" },
  { value: "Asia/Taipei", label: "台北时间 (UTC+8)", region: "亚洲" },
  { value: "Asia/Tokyo", label: "日本时间 (UTC+9)", region: "亚洲" },
  { value: "Asia/Seoul", label: "韩国时间 (UTC+9)", region: "亚洲" },
  { value: "Asia/Singapore", label: "新加坡时间 (UTC+8)", region: "亚洲" },
  { value: "America/Los_Angeles", label: "美国太平洋时间 (UTC-8/-7)", region: "美洲" },
  { value: "America/New_York", label: "美国东部时间 (UTC-5/-4)", region: "美洲" },
  { value: "America/Chicago", label: "美国中部时间 (UTC-6/-5)", region: "美洲" },
  { value: "Europe/London", label: "英国时间 (UTC+0/+1)", region: "欧洲" },
  { value: "Europe/Paris", label: "中欧时间 (UTC+1/+2)", region: "欧洲" },
  { value: "Europe/Berlin", label: "柏林时间 (UTC+1/+2)", region: "欧洲" },
  { value: "Australia/Sydney", label: "悉尼时间 (UTC+10/+11)", region: "大洋洲" },
  { value: "Australia/Melbourne", label: "墨尔本时间 (UTC+10/+11)", region: "大洋洲" },
  { value: "Pacific/Auckland", label: "新西兰时间 (UTC+12/+13)", region: "大洋洲" },
];

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export const TimezoneSelector = ({ value, onChange }: TimezoneSelectorProps) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  // 自动检测浏览器时区
  const detectTimezone = () => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    onChange(browserTimezone);
  };

  // 更新当前时间预览
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const zonedTime = toZonedTime(now, value);
        setCurrentTime(format(zonedTime, "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN }));
      } catch (error) {
        console.error("Error formatting time:", error);
        setCurrentTime("时间格式错误");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4" />
          时区设置
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectTimezone}
          className="text-xs"
        >
          自动检测
        </Button>
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="选择时区" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              <div className="flex flex-col">
                <span>{tz.label}</span>
                <span className="text-xs text-muted-foreground">{tz.region}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card className="p-3 bg-muted/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>当前时间：{currentTime}</span>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 时区设置将影响所有日期和时间的显示，包括情绪记录统计、训练营打卡等功能。
      </p>
    </div>
  );
};
