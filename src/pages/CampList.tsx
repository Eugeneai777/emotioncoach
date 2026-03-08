import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import { CampCardSkeleton } from "@/components/camp/CampCardSkeleton";
import { CampEmptyState } from "@/components/camp/CampEmptyState";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import type { CampTemplate } from "@/types/trainingCamp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";

const campCategories = [
  {
    id: 'youjin',
    name: '有劲训练营',
    emoji: '💪',
    description: '培养每日成长习惯，积累点滴进步',
  },
  {
    id: 'bloom',
    name: '绽放训练营',
    emoji: '🦋',
    description: '系统性生命成长课程，深度自我转化',
  }
];

const CampList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('youjin');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<CampTemplate | null>(null);

  const { isPaymentCallback } = usePaymentCallback({
    onSuccess: () => {
      toast.success("购买成功！", { description: "即将开启你的训练营之旅" });
      setPayDialogOpen(false);
    },
    showToast: false,
    showConfetti: true,
    autoRedirect: false,
  });

  useEffect(() => {
    if (isPaymentCallback) setPayDialogOpen(false);
  }, [isPaymentCallback]);

  const handlePurchase = (camp: CampTemplate) => {
    if (!user) {
      toast.error("请先登录", { description: "登录后即可购买训练营" });
      navigate('/auth');
      return;
    }
    setSelectedCamp(camp);
    setPayDialogOpen(true);
  };

  const { data: campTemplates, isLoading } = useQuery({
    queryKey: ['camp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as unknown as CampTemplate[];
    }
  });

  const filteredCamps = useMemo(() => {
    return campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory) || [];
  }, [campTemplates, activeCategory]);

  const currentCategory = campCategories.find(cat => cat.id === activeCategory)!;

  if (isLoading) {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title="训练营" showBack />
        <main className="container max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <CampCardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title="训练营" showBack />

        <main className="container max-w-2xl mx-auto px-4 pb-8">
          {/* Category Tabs - 紧凑胶囊切换 */}
          <div className="flex gap-2 py-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
            {campCategories.map(category => {
              const isActive = activeCategory === category.id;
              const count = campTemplates?.filter(c => (c.category || 'youjin') === category.id).length || 0;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                  <Badge variant="secondary" className={cn(
                    "text-[10px] px-1.5 py-0 h-4 min-w-0",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""
                  )}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Category Description */}
          <p className="text-sm text-muted-foreground mb-4 px-1">
            {currentCategory.description}
          </p>

          {/* Camp Cards - 单列大卡片 */}
          {filteredCamps.length > 0 ? (
            <div className="space-y-4">
              {filteredCamps.map((camp, index) => (
                <CampTemplateCard
                  key={camp.id}
                  camp={camp}
                  index={index}
                  enrolledCount={0}
                  onClick={() => {
                    if (camp.camp_type === 'parent_emotion_21') {
                      navigate('/parent-camp');
                    } else {
                      navigate(`/camp-template/${camp.id}`);
                    }
                  }}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          ) : (
            <CampEmptyState
              categoryName={currentCategory.name}
              onExploreOther={() => {
                const otherCategory = campCategories.find(c => c.id !== activeCategory);
                if (otherCategory) setActiveCategory(otherCategory.id);
              }}
            />
          )}
        </main>
      </div>

      <UnifiedPayDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        packageInfo={selectedCamp ? {
          key: `camp-${selectedCamp.id}`,
          name: selectedCamp.camp_name,
          price: selectedCamp.price || 0,
        } : null}
        onSuccess={() => {
          toast.success("购买成功！", { description: "即将开启你的训练营之旅" });
          setPayDialogOpen(false);
        }}
      />
    </>
  );
};

export default CampList;
