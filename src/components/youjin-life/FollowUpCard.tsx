import { Bell, ListTodo, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const followUps = [
  { icon: Bell, label: "设置提醒", action: "remind" },
  { icon: ListTodo, label: "加入待办", action: "todo" },
  { icon: RefreshCw, label: "继续优化", action: "refine" },
] as const;

export function FollowUpCard({ onRefine }: { onRefine?: () => void }) {
  const handleClick = (action: string) => {
    if (action === "refine" && onRefine) {
      onRefine();
      return;
    }
    toast.success(action === "remind" ? "提醒已设置" : "已加入待办");
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs text-gray-400 mb-2.5">接下来你可以...</p>
      <div className="flex gap-2">
        {followUps.map((f) => (
          <button
            key={f.action}
            onClick={() => handleClick(f.action)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]"
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
