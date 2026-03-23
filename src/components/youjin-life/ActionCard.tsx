import { Calendar, Zap, Phone } from "lucide-react";
import { toast } from "sonner";

interface Action {
  label: string;
  type: "book" | "execute" | "contact";
}

const iconMap = {
  book: Calendar,
  execute: Zap,
  contact: Phone,
};

export function ActionCard({ actions }: { actions: Action[] }) {
  const handleAction = (action: Action) => {
    toast.success(`${action.label} - 功能即将上线`);
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <p className="text-sm font-medium text-gray-700 mb-3">🚀 立即行动</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const Icon = iconMap[action.type];
          return (
            <button
              key={i}
              onClick={() => handleAction(action)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-blue-100 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors active:scale-[0.97]"
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
