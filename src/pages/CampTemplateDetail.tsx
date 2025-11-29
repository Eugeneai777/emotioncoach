import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  Sparkles, 
  Check,
  Users,
  Clock,
  ArrowLeft
} from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

const CampTemplateDetail = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const { user } = useAuth();

  const { data: camp, isLoading } = useQuery({
    queryKey: ['camp-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data as unknown as CampTemplate;
    },
    enabled: !!templateId
  });

  // 查询用户是否已有该类型的活跃训练营
  const { data: existingCamp } = useQuery({
    queryKey: ['existing-camp', camp?.camp_type, user?.id],
    queryFn: async () => {
      if (!user || !camp?.camp_type) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .eq('camp_type', camp.camp_type)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!camp?.camp_type
  });

  const hasJoinedCamp = !!existingCamp;

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

  if (!camp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">训练营不存在</p>
          <Button onClick={() => navigate('/camps')} className="mt-4">
            返回训练营列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
          <div className="container max-w-5xl mx-auto px-4 py-4">
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

        <main className="container max-w-5xl mx-auto px-4 py-12 space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            {!['emotion_bloom', 'identity_bloom'].includes(camp.camp_type) && (
              <Badge className={`bg-gradient-to-r ${camp.gradient} text-white border-0 px-4 py-1.5 text-sm`}>
                {camp.icon} {camp.duration_days}天养成计划
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              {camp.camp_name}
            </h1>
            {camp.camp_subtitle && (
              <p className="text-xl text-muted-foreground">
                {camp.camp_subtitle}
              </p>
            )}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {camp.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => {
                  if (hasJoinedCamp && existingCamp) {
                    navigate(`/camp/${existingCamp.id}`);
                  } else {
                    setShowStartDialog(true);
                  }
                }}
                className={`gap-2 bg-gradient-to-r ${camp.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                {hasJoinedCamp ? '继续训练' : '立即加入'}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/energy-studio")}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                探索更多工具
              </Button>
            </div>
          </section>

          {/* Stages */}
          {camp.stages && camp.stages.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">课程阶段</h2>
                <p className="text-muted-foreground">
                  循序渐进，系统化成长路径
                </p>
              </div>
              <div className="space-y-4">
                {camp.stages.map((stage: any, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${camp.gradient} text-white text-sm font-medium mb-2 w-fit`}>
                        第{stage.stage}阶
                      </div>
                      <CardTitle className="text-xl">{stage.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stage.lessons && stage.lessons.length > 0 ? (
                        <ul className="space-y-2">
                          {stage.lessons.map((lesson: string, lessonIndex: number) => (
                            <li key={lessonIndex} className="flex items-start gap-2">
                              <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${camp.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                                {lessonIndex + 1}
                              </div>
                              <span className="text-sm leading-relaxed">{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <CardDescription className="text-sm">{stage.description}</CardDescription>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Learning Formats */}
          {camp.learning_formats && camp.learning_formats.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">上课形式</h2>
                <p className="text-muted-foreground">
                  多样化学习体验，全方位成长支持
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {camp.learning_formats.map((format: any, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{format.icon}</div>
                        <CardTitle className="text-lg">{format.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{format.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Daily Practice */}
          {camp.daily_practice && camp.daily_practice.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">每日练习流程</h2>
                <p className="text-muted-foreground">
                  简单高效的日常练习，轻松融入生活
                </p>
              </div>
              <div className="space-y-4">
                {camp.daily_practice.map((practice: any, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${practice.gradient} text-white text-xs font-medium`}>
                          <Clock className="w-3 h-3" />
                          {practice.duration}
                        </div>
                        <div>
                          <div className="text-xl mb-1">{practice.time}</div>
                          <CardTitle className="text-lg">{practice.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{practice.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Benefits */}
          {camp.benefits && camp.benefits.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">你将获得</h2>
                <p className="text-muted-foreground">
                  {['emotion_bloom', 'identity_bloom'].includes(camp.camp_type) 
                    ? '实实在在的成长' 
                    : `${camp.duration_days}天后，实实在在的成长`
                  }
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {camp.benefits.map((benefit: string, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${camp.gradient} text-white`}>
                          <Check className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-base leading-relaxed">{benefit}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Target Audience */}
          {camp.target_audience && camp.target_audience.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">适合加入的人</h2>
                <p className="text-muted-foreground">
                  如果你有以下困扰或期待，这个训练营就是为你设计的
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {camp.target_audience.map((audience: string, index: number) => (
                  <Card 
                    key={index}
                    className="hover:shadow-lg transition-all duration-300"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed">{audience}</p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Prerequisites */}
          {camp.prerequisites && camp.prerequisites.message && (
            <section>
              <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-base">
                    <Users className="w-4 h-4" />
                    <span>报名条件</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-800 dark:text-amber-300 text-sm">
                    {camp.prerequisites.message}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* CTA Section */}
          <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${camp.gradient} p-12 text-center text-white`}>
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl font-bold">
                开始你的{['emotion_bloom', 'identity_bloom'].includes(camp.camp_type) 
                  ? '' 
                  : `${camp.duration_days}天`
                }{camp.camp_name}
              </h2>
              <p className="text-lg text-white/90">
                {camp.description}
              </p>
              <Button 
                size="lg" 
                onClick={() => {
                  if (hasJoinedCamp && existingCamp) {
                    navigate(`/camp/${existingCamp.id}`);
                  } else {
                    setShowStartDialog(true);
                  }
                }}
                className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {hasJoinedCamp ? '继续训练' : '立即开始'}
                <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-8 mt-16">
          <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 有劲生活馆. 让生命绽放</p>
          </div>
        </footer>
      </div>

      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={camp}
        onSuccess={(campId) => {
          setShowStartDialog(false);
          navigate(`/camp/${campId}`);
        }}
      />
    </>
  );
};

export default CampTemplateDetail;
