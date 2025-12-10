import { useNavigate } from "react-router-dom";
import { Palette, Users, Wallet, TrendingUp, QrCode } from "lucide-react";

interface PartnerQuickActionsProps {
  onTabChange?: (tab: string) => void;
}

export function PartnerQuickActions({ onTabChange }: PartnerQuickActionsProps) {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Palette,
      label: "生成海报",
      description: "AI智能海报",
      gradient: "from-orange-400 to-amber-500",
      bgGradient: "from-orange-50 to-amber-50",
      onClick: () => navigate('/poster-center')
    },
    {
      icon: QrCode,
      label: "推广设置",
      description: "入口配置",
      gradient: "from-teal-400 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50",
      onClick: () => onTabChange?.('promote')
    },
    {
      icon: Users,
      label: "学员管理",
      description: "查看转化",
      gradient: "from-blue-400 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50",
      onClick: () => onTabChange?.('students')
    },
    {
      icon: TrendingUp,
      label: "收益明细",
      description: "佣金提现",
      gradient: "from-green-400 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      onClick: () => onTabChange?.('earnings')
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex flex-col items-center p-3 rounded-xl bg-gradient-to-br ${action.bgGradient} hover:shadow-md transition-all group`}
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
            <span className="text-xs text-muted-foreground hidden sm:block">{action.description}</span>
          </button>
        );
      })}
    </div>
  );
}
