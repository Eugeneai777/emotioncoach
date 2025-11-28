import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import type { CampTemplate } from "@/types/trainingCamp";
import { cn } from "@/lib/utils";
const campCategories = [{
  id: 'youjin',
  name: '有劲训练营',
  subtitle: '每天成长',
  emoji: '💪',
  gradient: 'from-orange-500 to-amber-500',
  description: '培养每日成长习惯，积累点滴进步'
}, {
  id: 'bloom',
  name: '绽放训练营',
  subtitle: '深度转化',
  emoji: '🦋',
  gradient: 'from-purple-500 to-pink-500',
  description: '系统性的生命成长课程，实现深度自我转化'
}];
const CampList = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('youjin');
  const {
    data: campTemplates,
    isLoading
  } = useQuery({
    queryKey: ['camp-templates'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('camp_templates').select('*').eq('is_active', true).order('display_order');
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
  const filteredCamps = campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory) || [];
  const currentCategory = campCategories.find(cat => cat.id === activeCategory)!;
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/energy-studio")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              选择你的成长之旅
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              专业导师陪伴，社群共同成长，科学系统的学习路径
            </p>
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-10 h-auto p-2 bg-card/50 backdrop-blur-sm rounded-2xl">
            {campCategories.map(category => <TabsTrigger key={category.id} value={category.id} className={cn("rounded-xl transition-all duration-300 gap-3 py-5 px-8", "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105", category.id === 'youjin' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500", category.id === 'bloom' && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500")}>
                <span className="text-3xl">{category.emoji}</span>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-base">{category.name}</span>
                  <span className="text-sm opacity-90">{category.subtitle}</span>
                </div>
              </TabsTrigger>)}
          </TabsList>

          {/* Category Description */}
          <div className="mb-8 text-center space-y-2 animate-in fade-in-50 duration-500">
            
            <p className="text-muted-foreground text-lg">{currentCategory.description}</p>
          </div>

          {/* Training Camps Grid */}
          <TabsContent value={activeCategory} className="mt-0">
            {filteredCamps.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCamps.map((camp, index) => <CampTemplateCard 
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
                />)}
              </div> : <div className="text-center py-12">
                <p className="text-muted-foreground">该分类下暂无训练营</p>
              </div>}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 有劲生活馆. 让生命绽放</p>
        </div>
      </footer>

    </div>;
};
export default CampList;