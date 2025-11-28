import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight,
  Sparkles, 
  TrendingDown,
  Brain,
  Moon,
  Zap,
  Check,
  Users,
  BarChart3,
  Video,
  Heart,
  MessageCircle,
  Shield,
  Award,
  Clock
} from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

const iconMap: Record<string, any> = {
  TrendingDown, Brain, Moon, Zap, Heart, MessageCircle, Shield, Award, Users, Video, BarChart3
};

const CampIntro = () => {
  const navigate = useNavigate();
  const { campType } = useParams<{ campType: string }>();
  const [showStartDialog, setShowStartDialog] = useState(false);

  const { data: campTemplate, isLoading } = useQuery({
    queryKey: ['camp-template', campType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', campType)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('训练营不存在');
      return data as unknown as CampTemplate;
    },
    enabled: !!campType
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

  if (!campTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">训练营不存在</p>
          <Button onClick={() => navigate("/camps")}>返回训练营列表</Button>
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
            onClick={() => navigate("/camps")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {!['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
            <div className="inline-block">
              <Badge className={`bg-gradient-to-r ${campTemplate.gradient} text-white border-0 px-4 py-1 text-sm`}>
                {campTemplate.icon} {campTemplate.duration_days}天养成计划
              </Badge>
            </div>
          )}
          <div className="space-y-4">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${campTemplate.gradient} bg-clip-text text-transparent leading-tight`}>
              {campTemplate.camp_name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {campTemplate.description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => setShowStartDialog(true)}
              className={`gap-2 bg-gradient-to-r ${campTemplate.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6`}
            >
              立即加入
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/energy-studio")}
              className="gap-2 text-lg px-8 py-6"
            >
              <Sparkles className="w-5 h-5" />
              探索更多工具
            </Button>
          </div>
        </section>

        {/* Stages */}
        {campTemplate.stages && campTemplate.stages.length > 0 && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">课程阶段</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                循序渐进，系统化成长路径
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campTemplate.stages.map((stage: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2">
                  <CardHeader>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${campTemplate.gradient} text-white text-sm font-medium mb-3 w-fit`}>
                      第{stage.stage}阶
                    </div>
                    <CardTitle className="text-2xl mb-4">{stage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stage.lessons && stage.lessons.length > 0 ? (
                      <ul className="space-y-3">
                        {stage.lessons.map((lesson: string, lessonIndex: number) => (
                          <li key={lessonIndex} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${campTemplate.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                              {lessonIndex + 1}
                            </div>
                            <span className="text-sm leading-relaxed">{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <CardDescription className="text-base">{stage.description}</CardDescription>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Learning Formats */}
        {campTemplate.learning_formats && campTemplate.learning_formats.length > 0 && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">上课形式</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                多样化学习体验，全方位成长支持
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campTemplate.learning_formats.map((format: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="text-4xl">{format.icon}</div>
                      <CardTitle className="text-xl">{format.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{format.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Daily Practice */}
        {campTemplate.daily_practice && campTemplate.daily_practice.length > 0 && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">每日练习流程</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                简单高效的日常练习，轻松融入生活
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campTemplate.daily_practice.map((practice: any, index: number) => (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${practice.gradient} text-white text-sm font-medium`}>
                        <Clock className="w-4 h-4" />
                        {practice.duration}
                      </div>
                      <div>
                        <div className="text-2xl mb-2">{practice.time}</div>
                        <CardTitle className="text-2xl">{practice.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{practice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {campTemplate.benefits && campTemplate.benefits.length > 0 && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">你将获得</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) 
                  ? '实实在在的成长' 
                  : `${campTemplate.duration_days}天后，实实在在的成长`
                }
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campTemplate.benefits.map((benefit: string, index: number) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${campTemplate.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{benefit}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Target Audience */}
        {campTemplate.target_audience && campTemplate.target_audience.length > 0 && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">适合加入的人</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                如果你有以下困扰或期待，这个训练营就是为你设计的
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {campTemplate.target_audience.map((audience: string, index: number) => (
                <Card 
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Check className={`w-5 h-5 text-primary flex-shrink-0 mt-0.5`} />
                      <p className="text-sm leading-relaxed">{audience}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Prerequisites */}
        {campTemplate.prerequisites && campTemplate.prerequisites.required_camp && (
          <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Users className="w-5 h-5" />
                  <span>报名条件</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 dark:text-amber-300 text-base">
                  {campTemplate.prerequisites.message}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* CTA Section */}
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${campTemplate.gradient} p-12 text-center text-white animate-in fade-in-50 slide-in-from-bottom-4 duration-700`}>
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              开始你的{['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) 
                ? '' 
                : `${campTemplate.duration_days}天`
              }{campTemplate.camp_name}
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {campTemplate.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => setShowStartDialog(true)}
                className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
              >
                立即开始
                <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 有劲生活馆. 让生命绽放</p>
        </div>
      </footer>

      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={campTemplate}
        onSuccess={() => navigate("/")}
      />
    </div>
  );
};

export default CampIntro;
