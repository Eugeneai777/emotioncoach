import { Globe, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PostVisibility = "public" | "followers_only" | "private";

interface VisibilitySelectorProps {
  value: PostVisibility;
  onChange: (value: PostVisibility) => void;
}

const options: { value: PostVisibility; label: string; icon: typeof Globe; desc: string }[] = [
  { value: "public", label: "公开", icon: Globe, desc: "所有人可见" },
  { value: "followers_only", label: "仅关注者", icon: Users, desc: "仅关注你的人可见" },
  { value: "private", label: "仅自己", icon: Lock, desc: "仅自己可见" },
];

const VisibilitySelector = ({ value, onChange }: VisibilitySelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">可见范围</label>
      <div className="flex gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all touch-manipulation min-h-[56px]",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VisibilitySelector;
