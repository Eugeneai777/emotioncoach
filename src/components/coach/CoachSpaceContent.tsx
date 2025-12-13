import { useNavigate } from "react-router-dom";
import { CoachCard } from "./CoachCard";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ArrowRight, Star, Shield } from "lucide-react";

// Icon mapping for coach templates
const iconMap: Record<string, string> = {
  'emotion': 'Heart',
  'parent': 'Users',
  'communication': 'MessageSquare',
  'story': 'BookOpen',
  'vibrant_life_sage': 'Sparkles',
};

// Badge mapping based on coach_key or custom logic
const getBadge = (coachKey: string, displayOrder: number): string | null => {
  if (coachKey === 'vibrant_life_sage' || coachKey === 'emotion') return '推荐';
  if (coachKey === 'communication' || coachKey === 'story') return '新';
  if (displayOrder <= 2) return '推荐';
  return null;
};

export const CoachSpaceContent = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">🎯 教练空间</h2>
          <p className="text-muted-foreground">选择适合你的教练开始今天的成长</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Transform database templates to coach card props
  const coaches = templates?.map(template => ({
    id: template.coach_key,
    title: template.title,
    subtitle: template.subtitle || '',
    description: template.description || '',
    icon: iconMap[template.coach_key] || 'Sparkles',
    gradient: template.gradient,
    route: template.page_route,
    badge: getBadge(template.coach_key, template.display_order),
  })) || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🎯 教练空间</h2>
        <p className="text-muted-foreground">选择适合你的教练开始今天的成长</p>
      </div>

      {/* AI Coach Cards Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">🤖</span> AI 智能教练
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map(coach => (
            <CoachCard key={coach.id} {...coach} />
          ))}
        </div>
      </div>

      {/* Human Coach Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">👩‍🏫</span> 真人教练
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            一对一
          </Badge>
        </h3>
        <Card 
          className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-teal-50/50"
          onClick={() => navigate('/human-coaches')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold">预约真人教练</h4>
                  <Badge className="bg-teal-500">新</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  专业认证教练一对一咨询，深度陪伴你的成长
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-teal-500" />
                    资质认证
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    用户评价
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
