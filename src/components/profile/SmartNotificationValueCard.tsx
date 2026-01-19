import { Bell, Heart, Gift, TrendingUp, MessageCircle } from "lucide-react";

interface SmartNotificationValueCardProps {
  compact?: boolean;
}

export function SmartNotificationValueCard({ compact = false }: SmartNotificationValueCardProps) {
  const benefits = [
    {
      icon: Heart,
      title: "即时陪伴",
      description: "在你需要时收到温暖问候",
      color: "text-rose-500",
      bg: "bg-rose-50"
    },
    {
      icon: MessageCircle,
      title: "个性化关怀",
      description: "基于你的记忆和偏好定制",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      icon: TrendingUp,
      title: "成长见证",
      description: "记录每个里程碑时刻",
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      icon: Gift,
      title: "温柔提醒",
      description: "不带压力的关心",
      color: "text-violet-500",
      bg: "bg-violet-50"
    }
  ];

  if (compact) {
    return (
      <div className="bg-emerald-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-emerald-800 mb-2 flex items-center gap-1.5">
          <Bell className="w-4 h-4" />
          完善资料后你将获得：
        </p>
        <ul className="space-y-1 text-emerald-700">
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            AI会用你的昵称亲切地称呼你
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            分享卡片显示你的专属头像
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            开启智能消息，关键时刻收到温暖问候
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Bell className="w-5 h-5" />
        <h3 className="font-medium">智能消息的价值</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {benefits.map((benefit) => (
          <div 
            key={benefit.title}
            className={`${benefit.bg} rounded-lg p-3 space-y-1`}
          >
            <div className="flex items-center gap-2">
              <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
              <span className="font-medium text-sm text-foreground">{benefit.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        完善资料后，这些智能消息将根据你的个人偏好发送 💚
      </p>
    </div>
  );
}
