import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import type { CampTemplate } from "@/types/trainingCamp";

const CampList = () => {
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/energy-studio")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 mb-16 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              选择你的成长之旅
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              每个训练营都是一次深度的自我探索，开启属于你的绽放之路
            </p>
          </div>
        </section>

        {/* Training Camps Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campTemplates?.map((camp, index) => (
            <CampTemplateCard
              key={camp.id}
              camp={camp}
              index={index}
              onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
            />
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 有劲生活馆. 让生命绽放</p>
        </div>
      </footer>
    </div>
  );
};

export default CampList;
