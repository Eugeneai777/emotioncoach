import { cn } from "@/lib/utils";

export const GRADIENT_PRESETS = [
  {
    id: "gentle_pink",
    name: "温柔粉",
    emoji: "🌸",
    value: "linear-gradient(135deg, #ffeef8 0%, #fff5f8 50%, #fff 100%)",
    textColor: "dark" as const,
  },
  {
    id: "healing_green",
    name: "治愈绿",
    emoji: "🌿",
    value: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff 100%)",
    textColor: "dark" as const,
  },
  {
    id: "calm_blue",
    name: "宁静蓝",
    emoji: "🌊",
    value: "linear-gradient(135deg, #e3f2fd 0%, #e8f4fd 50%, #fff 100%)",
    textColor: "dark" as const,
  },
  {
    id: "warm_orange",
    name: "暖阳橙",
    emoji: "🌅",
    value: "linear-gradient(135deg, #fff3e0 0%, #fff8e1 50%, #fff 100%)",
    textColor: "dark" as const,
  },
  {
    id: "starry_purple",
    name: "星空紫",
    emoji: "🌌",
    value: "linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #9c27b0 100%)",
    textColor: "light" as const,
  },
  {
    id: "sunny_yellow",
    name: "向阳黄",
    emoji: "🌻",
    value: "linear-gradient(135deg, #fffde7 0%, #fff9c4 50%, #fff 100%)",
    textColor: "dark" as const,
  },
  {
    id: "ocean_teal",
    name: "海洋青",
    emoji: "🌊",
    value: "linear-gradient(135deg, #b2dfdb 0%, #80cbc4 50%, #4db6ac 100%)",
    textColor: "dark" as const,
  },
  {
    id: "sunset_red",
    name: "晚霞红",
    emoji: "🌇",
    value: "linear-gradient(135deg, #ffccbc 0%, #ff8a65 50%, #ff7043 100%)",
    textColor: "light" as const,
  },
];

interface GradientPickerProps {
  selected: string;
  onSelect: (gradient: string, textColor: "dark" | "light") => void;
  className?: string;
}

export default function GradientPicker({
  selected,
  onSelect,
  className,
}: GradientPickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium">选择渐变背景</label>
      <div className="grid grid-cols-4 gap-3">
        {GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.value, preset.textColor)}
            className={cn(
              "relative h-16 rounded-lg overflow-hidden",
              "border-2 transition-all duration-200",
              "hover:scale-105 hover:shadow-md",
              selected === preset.value
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            )}
            style={{ background: preset.value }}
            title={preset.name}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl drop-shadow-md">{preset.emoji}</span>
            </div>
            {selected === preset.value && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>当前选择：</span>
        <span className="font-medium">
          {GRADIENT_PRESETS.find((p) => p.value === selected)?.name || "自定义"}
        </span>
      </div>
    </div>
  );
}
