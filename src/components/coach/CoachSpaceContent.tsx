import { useNavigate } from "react-router-dom";
import { CoachCard } from "./CoachCard";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { Skeleton } from "@/components/ui/skeleton";

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

      {/* Coach Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map(coach => (
          <CoachCard key={coach.id} {...coach} />
        ))}
      </div>
    </div>
  );
};
