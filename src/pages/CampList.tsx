import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import { CampCardSkeleton } from "@/components/camp/CampCardSkeleton";
import { CampEmptyState } from "@/components/camp/CampEmptyState";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import type { CampTemplate } from "@/types/trainingCamp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { BookOpen, HeartHandshake, Target, Sparkles } from "lucide-react";

const campCategories = [
  {
    id: 'youjin',
    name: '有劲训练营',
    emoji: '💪',
    description: '培养每日成长习惯，积累点滴进步',
    intro: '通过系统化训练，帮助你建立稳定的情绪管理能力和积极的生活习惯。每天只需15-30分钟，AI教练全程陪伴，按自己的节奏成长。',
    features: [
      { icon: '📝', label: '每日打卡', desc: '结构化任务引导' },
      { icon: '🤖', label: 'AI教练', desc: '随时对话支持' },
      { icon: '📊', label: '成长档案', desc: '可视化进步轨迹' },
    ],
  },
  {
    id: 'bloom',
    name: '绽放训练营',
    emoji: '🦋',
    description: '系统性生命成长课程，深度自我转化',
    intro: '由专业人类教练1对1陪伴，包含情感疗愈、身份重建、生命力绽放三大模块，适合希望实现深层改变的你。',
    features: [
      { icon: '👩‍🏫', label: '真人教练', desc: '1对1专业陪伴' },
      { icon: '🎥', label: '视频课程', desc: '体系化学习内容' },
      { icon: '🌱', label: '深度转化', desc: '从根源实现改变' },
    ],
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
          {/* Hero 简介 */}
          <section className="py-5 space-y-2">
            <h1 className="text-xl font-bold text-foreground">选择适合你的成长路径</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              科学设计的训练体系，专业教练全程陪伴，帮助你在情绪管理、亲子关系、自我成长等方面实现真正改变。
            </p>
          </section>

          {/* 为什么选择训练营 */}
          <section className="grid grid-cols-3 gap-2 mb-5">
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <Target className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">目标明确</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">每日清晰任务</div>
            </Card>
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <HeartHandshake className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">教练陪伴</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">不再孤军奋战</div>
            </Card>
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <BookOpen className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">科学体系</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">循序渐进课程</div>
            </Card>
          </section>

          {/* Category Tabs */}
          <div className="flex gap-2 pb-3 sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2">
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

          {/* Category Intro Card */}
          <Card className="p-4 mb-4 border-border/40 bg-muted/30">
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              {currentCategory.intro}
            </p>
            <div className="flex gap-3">
              {currentCategory.features.map((f, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-lg">{f.icon}</span>
                  <div className="text-xs font-medium text-foreground mt-1">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Camp Cards */}
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
