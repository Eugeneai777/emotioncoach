import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, MessageCircle, BookOpen, Sparkles, Wallet, Flower2, Target } from "lucide-react";

// 服务配置
const SERVICE_CONFIG: Record<string, {
  name: string;
  route: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}> = {
  emotion: {
    name: '情绪教练',
    route: '/emotion-coach',
    description: '通过情绪四部曲深度梳理情绪',
    icon: Heart,
    gradient: 'from-emerald-50 to-green-50',
    iconColor: 'text-emerald-600'
  },
  parent: {
    name: '亲子教练',
    route: '/parent-coach',
    description: '改善亲子关系，理解孩子',
    icon: Users,
    gradient: 'from-purple-50 to-violet-50',
    iconColor: 'text-purple-600'
  },
  wealth: {
    name: '财富觉醒训练营',
    route: '/wealth-camp-intro',
    description: '发现并突破财富卡点',
    icon: Wallet,
    gradient: 'from-amber-50 to-yellow-50',
    iconColor: 'text-amber-600'
  },
  gratitude: {
    name: '感恩教练',
    route: '/gratitude-journal',
    description: '记录感恩时刻，提升幸福感',
    icon: Flower2,
    gradient: 'from-pink-50 to-rose-50',
    iconColor: 'text-pink-600'
  },
  alive_check: {
    name: '死了吗签到',
    route: '/alive-check',
    description: '每日生命签到，唤醒生活热情',
    icon: Target,
    gradient: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600'
  },
  emotion_button: {
    name: '情绪按钮',
    route: '/emotion-button',
    description: '288条认知提醒，即时情绪疗愈',
    icon: Sparkles,
    gradient: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600'
  },
  communication: {
    name: '沟通教练',
    route: '/communication-coach',
    description: '提升沟通技巧，改善人际关系',
    icon: MessageCircle,
    gradient: 'from-blue-50 to-indigo-50',
    iconColor: 'text-indigo-600'
  },
  vibrant_life_sage: {
    name: '有劲AI生活教练',
    route: '/coach/vibrant_life_sage',
    description: '24小时智能陪伴，随时倾听',
    icon: Heart,
    gradient: 'from-rose-50 to-red-50',
    iconColor: 'text-rose-600'
  },
  story: {
    name: '故事教练',
    route: '/story-coach',
    description: '用故事疗愈心灵，发现内在智慧',
    icon: BookOpen,
    gradient: 'from-amber-50 to-orange-50',
    iconColor: 'text-amber-600'
  }
};

interface ServiceRecommendationCardProps {
  coachType: string;
  reasoning?: string | null;
  className?: string;
}

export const ServiceRecommendationCard = ({ 
  coachType, 
  reasoning,
  className = ""
}: ServiceRecommendationCardProps) => {
  const navigate = useNavigate();
  const config = SERVICE_CONFIG[coachType] || SERVICE_CONFIG.vibrant_life_sage;
  const Icon = config.icon;

  return (
    <Card className={`bg-gradient-to-r ${config.gradient} border-none shadow-sm ${className}`}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          🎯 推荐服务
        </p>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center ${config.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{config.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {reasoning || config.description}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            className="shrink-0 bg-white/80 hover:bg-white"
            onClick={() => navigate(config.route)}
          >
            去试试
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const getServiceConfig = (coachType: string) => {
  return SERVICE_CONFIG[coachType] || SERVICE_CONFIG.vibrant_life_sage;
};
