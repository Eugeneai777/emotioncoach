import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Sparkles, Filter, Home, ChevronRight } from "lucide-react";
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
    subtitle: '每天成长',
    emoji: '💪',
    gradient: 'from-orange-500 to-amber-500',
    description: '培养每日成长习惯，积累点滴进步'
  },
  {
    id: 'bloom',
    name: '绽放训练营',
    subtitle: '深度转化',
    emoji: '🦋',
    gradient: 'from-purple-500 to-pink-500',
    description: '系统性的生命成长课程，实现深度自我转化'
  }
];

const CampList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState('youjin');
  const [sortBy, setSortBy] = useState<'popular' | 'duration' | 'newest'>('popular');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<CampTemplate | null>(null);

  // 处理小程序支付成功回调
  const { isPaymentCallback } = usePaymentCallback({
    onSuccess: () => {
      console.log('[CampList] Payment callback success');
      toast.success("购买成功！", { description: "即将开启你的训练营之旅" });
      setPayDialogOpen(false);
    },
    showToast: false,
    showConfetti: true,
    autoRedirect: false,
  });

  // 小程序支付回调时关闭弹窗
  useEffect(() => {
    if (isPaymentCallback) {
      setPayDialogOpen(false);
    }
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

  const {
    data: campTemplates,
    isLoading
  } = useQuery({
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

  const categoryCampCount = useMemo(() => {
    return campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory).length || 0;
  }, [campTemplates, activeCategory]);

  // 筛选和排序
  const filteredAndSortedCamps = useMemo(() => {
    let camps = campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory) || [];

    if (sortBy === 'duration') {
      camps = [...camps].sort((a, b) => a.duration_days - b.duration_days);
    } else if (sortBy === 'newest') {
      camps = [...camps].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    return camps;
  }, [campTemplates, activeCategory, sortBy]);

  const currentCategory = campCategories.find(cat => cat.id === activeCategory)!;

  if (isLoading) {
    return (
      <div
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PageHeader title="训练营" showBack />

        <main className="container max-w-6xl mx-auto px-4 py-12">
          {/* Skeleton Hero */}
          <div className="text-center space-y-6 mb-12">
            <div className="space-y-4">
              <div className="h-16 w-3/4 mx-auto bg-teal-100/50 animate-pulse rounded-lg" />
              <div className="h-6 w-1/2 mx-auto bg-teal-100/50 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CampCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
      <PageHeader title="训练营列表" showBack rightActions={
        <Button variant="outline" size="sm" onClick={() => navigate("/camps")} className="gap-2 border-teal-300/50 text-teal-700 hover:bg-teal-50/50">
          <Users className="w-4 h-4" />
          我的训练营
        </Button>
      } />

      <main className="container max-w-6xl mx-auto px-4 py-6 sm:py-12">
        {/* Hero Section with Stats */}
        <section className="relative text-center space-y-4 sm:space-y-8 mb-6 sm:mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {/* Decorative backgrounds removed for mobile performance */}

          <div className="space-y-4">
            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 text-base px-4 py-2 animate-pulse">
              <Sparkles className="w-4 h-4 inline mr-2" />
              专业成长训练营
            </Badge>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              选择你的成长之旅
            </h1>
            
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              专业导师陪伴，社群共同成长，科学系统的学习路径
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-teal-50/80 to-cyan-50/60 border-teal-200/50 dark:from-teal-950/30 dark:to-cyan-950/20 dark:border-teal-800/30">
              <div className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">系统</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">科学课程体系</div>
            </Card>
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-cyan-50/80 to-blue-50/60 border-cyan-200/50 dark:from-cyan-950/30 dark:to-blue-950/20 dark:border-cyan-800/30">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">陪伴</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">专业导师指导</div>
            </Card>
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50/80 to-teal-50/60 border-blue-200/50 dark:from-blue-950/30 dark:to-teal-950/20 dark:border-blue-800/30">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">社群</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">共同成长</div>
            </Card>
          </div>
        </section>

        {/* Tabs with Enhanced Design */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-4 sm:mb-10 h-auto p-2 
            bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-200/30
            dark:bg-teal-950/30 dark:border-teal-800/30">
            {campCategories.map(category => {
              const catCampCount = campTemplates?.filter(c => (c.category || 'youjin') === category.id).length || 0;

              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className={cn(
                    "rounded-xl transition-all duration-300",
                    "py-3 px-3 sm:py-6 sm:px-8 gap-2 sm:gap-3",
                    "data-[state=active]:text-white data-[state=active]:shadow-xl sm:data-[state=active]:scale-105",
                    category.id === 'youjin' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500",
                    category.id === 'bloom' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-3xl">{category.emoji}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-sm sm:text-base">{category.name}</span>
                      <span className="hidden sm:block text-xs opacity-90">{category.subtitle}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="hidden sm:flex bg-white/20 text-white border-0 mt-2 text-xs">
                    {catCampCount}个训练营
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Category Description and Filters */}
          <div className="mb-4 sm:mb-8 space-y-4 animate-in fade-in-50 duration-500">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-base sm:text-lg">{currentCategory.description}</p>
            </div>

            {/* Filter and Sort */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                <span>共 {categoryCampCount} 个训练营</span>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px] border-teal-300/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duration">⏱️ 时长排序</SelectItem>
                    <SelectItem value="newest">✨ 最新发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Training Camps Grid */}
          <TabsContent value={activeCategory} className="mt-0">
            {filteredAndSortedCamps.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 items-stretch">
                {filteredAndSortedCamps.map((camp, index) => (
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer simplified */}
      <footer className="border-t border-teal-200/30 py-4 mt-8 bg-white/50 dark:bg-teal-950/20 dark:border-teal-800/30">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 有劲生活馆. 让生命绽放
          </p>
        </div>
      </footer>

      {/* WeChat Pay Dialog */}
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
      </div>
    </>
  );
};

export default CampList;