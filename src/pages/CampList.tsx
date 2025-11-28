import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, TrendingUp, Users, Sparkles, Filter, Home, ChevronRight } from "lucide-react";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import { CampCardSkeleton } from "@/components/camp/CampCardSkeleton";
import { CampEmptyState } from "@/components/camp/CampEmptyState";
import type { CampTemplate } from "@/types/trainingCamp";
import { cn } from "@/lib/utils";

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
  const [activeCategory, setActiveCategory] = useState('youjin');
  const [sortBy, setSortBy] = useState<'popular' | 'duration' | 'newest'>('popular');

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

  // 查询报名人数
  const { data: enrollmentStats } = useQuery({
    queryKey: ['camp-enrollment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_camps')
        .select('camp_type');
      if (error) throw error;

      const stats: Record<string, number> = {};
      data.forEach((camp: any) => {
        stats[camp.camp_type] = (stats[camp.camp_type] || 0) + 1;
      });
      return stats;
    }
  });

  // 计算统计数据
  const stats = useMemo(() => {
    const totalCamps = campTemplates?.length || 0;
    const totalEnrolled = Object.values(enrollmentStats || {}).reduce((sum, count) => sum + count, 0);
    const categoryCamps = campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory).length || 0;
    const categoryEnrolled = campTemplates
      ?.filter(camp => (camp.category || 'youjin') === activeCategory)
      .reduce((sum, camp) => sum + (enrollmentStats?.[camp.camp_type] || 0), 0) || 0;

    return {
      total: { camps: totalCamps, enrolled: totalEnrolled },
      category: { camps: categoryCamps, enrolled: categoryEnrolled }
    };
  }, [campTemplates, enrollmentStats, activeCategory]);

  // 筛选和排序
  const filteredAndSortedCamps = useMemo(() => {
    let camps = campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory) || [];

    // 排序
    if (sortBy === 'popular') {
      camps = [...camps].sort((a, b) => 
        (enrollmentStats?.[b.camp_type] || 0) - (enrollmentStats?.[a.camp_type] || 0)
      );
    } else if (sortBy === 'duration') {
      camps = [...camps].sort((a, b) => a.duration_days - b.duration_days);
    } else if (sortBy === 'newest') {
      camps = [...camps].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    return camps;
  }, [campTemplates, activeCategory, sortBy, enrollmentStats]);

  const currentCategory = campCategories.find(cat => cat.id === activeCategory)!;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
          <div className="container max-w-6xl mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/energy-studio")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </div>
        </header>

        <main className="container max-w-6xl mx-auto px-4 py-12">
          {/* Skeleton Hero */}
          <div className="text-center space-y-6 mb-12">
            <div className="space-y-4">
              <div className="h-16 w-3/4 mx-auto bg-muted animate-pulse rounded-lg" />
              <div className="h-6 w-1/2 mx-auto bg-muted animate-pulse rounded-lg" />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header with Breadcrumb */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/energy-studio")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
                <span>能量工作室</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">训练营列表</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/camps")}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              我的训练营
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section with Stats */}
        <section className="relative text-center space-y-8 mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {/* Decorative Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
            <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
          </div>

          <div className="space-y-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-base px-4 py-2 animate-pulse">
              <Sparkles className="w-4 h-4 inline mr-2" />
              专业成长训练营
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              选择你的成长之旅
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              专业导师陪伴，社群共同成长，科学系统的学习路径
            </p>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{stats.total.camps}</div>
              <div className="text-sm text-muted-foreground mt-1">训练营总数</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{stats.total.enrolled}+</div>
              <div className="text-sm text-muted-foreground mt-1">参与人数</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="text-3xl font-bold text-blue-600">21天</div>
              <div className="text-sm text-muted-foreground mt-1">科学周期</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="text-3xl font-bold text-emerald-600">专业</div>
              <div className="text-sm text-muted-foreground mt-1">导师陪伴</div>
            </Card>
          </div>
        </section>

        {/* Tabs with Enhanced Design */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-10 h-auto p-2 bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg">
            {campCategories.map(category => {
              const categoryStats = {
                camps: campTemplates?.filter(c => (c.category || 'youjin') === category.id).length || 0,
                enrolled: campTemplates
                  ?.filter(c => (c.category || 'youjin') === category.id)
                  .reduce((sum, c) => sum + (enrollmentStats?.[c.camp_type] || 0), 0) || 0
              };

              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className={cn(
                    "rounded-xl transition-all duration-300 gap-3 py-6 px-8",
                    "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105",
                    category.id === 'youjin' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500",
                    category.id === 'bloom' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.emoji}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-base">{category.name}</span>
                      <span className="text-xs opacity-90">{category.subtitle}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs mt-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {categoryStats.camps}个
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {categoryStats.enrolled}人
                    </Badge>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Category Description and Filters */}
          <div className="mb-8 space-y-4 animate-in fade-in-50 duration-500">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-lg">{currentCategory.description}</p>
            </div>

            {/* Filter and Sort */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>共 {stats.category.camps} 个训练营，{stats.category.enrolled} 人参与</span>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">🔥 最热门</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedCamps.map((camp, index) => (
                  <CampTemplateCard
                    key={camp.id}
                    camp={camp}
                    index={index}
                    enrolledCount={enrollmentStats?.[camp.camp_type] || 0}
                    onClick={() => {
                      // 对于「21天青少年问题家庭训练营」，导航到专属页面
                      if (camp.camp_type === 'parent_emotion_21') {
                        navigate('/parent-camp');
                      } else {
                        // 其他训练营导航到通用详情页
                        navigate(`/camp-template/${camp.id}`);
                      }
                    }}
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

      {/* Footer */}
      <footer className="border-t py-8 mt-16 bg-card/50">
        <div className="container max-w-6xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">关于我们</a>
            <a href="#" className="hover:text-primary transition-colors">使用条款</a>
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary transition-colors">联系我们</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 有劲生活馆. 让生命绽放
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CampList;
