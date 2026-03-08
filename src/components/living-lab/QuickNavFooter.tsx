import { useNavigate } from "react-router-dom";

const entries = [
  { label: "教练空间", emoji: "🧭", route: "/coach-space" },
  { label: "学习课程", emoji: "📚", route: "/courses" },
  { label: "训练营", emoji: "🏕️", route: "/camps" },
  { label: "合伙人", emoji: "🤝", route: "/partner/type" },
  { label: "健康商城", emoji: "🛒", route: "/energy-studio" },
];

const QuickNavFooter = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <span>🚀</span> 更多服务
      </h3>
      <div className="grid grid-cols-5 gap-1.5">
        {entries.map((entry) => (
          <button
            key={entry.label}
            onClick={() => navigate(entry.route)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-95 transition-all"
          >
            <span className="text-lg">{entry.emoji}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{entry.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickNavFooter;
