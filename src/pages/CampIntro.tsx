import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";
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
import { CampDualTrackSection } from "@/components/camp/CampDualTrackSection";

const iconMap: Record<string, any> = {
  TrendingDown, Brain, Moon, Zap, Heart, MessageCircle, Shield, Award, Users, Video, BarChart3
};

const CampIntro = () => {
  const navigate = useNavigate();
  const { campType } = useParams<{ campType: string }>();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const { user } = useAuth();

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

  // 查询用户是否已有该类型的活跃训练营
  const { data: existingCamp } = useQuery({
    queryKey: ['existing-camp', campType, user?.id],
    queryFn: async () => {
      if (!user || !campType) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .eq('camp_type', campType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!campType
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

  const isParentCamp = campType?.includes('parent') || campType?.includes('teen');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-24">
      <Helmet>
        <title>{campTemplate?.camp_name || '训练营'} - 有劲AI</title>
        <meta name="description" content={campTemplate?.description || '系统化训练营，助你成长蜕变'} />
        <meta property="og:title" content={`有劲AI｜${campTemplate?.camp_name || '训练营'}`} />
        <meta property="og:description" content={campTemplate?.description || '科学方法，系统训练，见证成长'} />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content={`https://wechat.eugenewe.net/camp/${campType}`} />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isParentCamp ? "/parent-diary" : "/camps")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
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
        </section>

        {/* Stages */}
        {campTemplate.stages && campTemplate.stages.length > 0 && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">课程阶段</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                循序渐进，系统化成长路径
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campTemplate.stages.map((stage: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 bg-white/80 border-purple-100">
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

        {/* Dual Track Mode - Only for parent camps */}
        {campTemplate.camp_type.includes('parent') && (
          <CampDualTrackSection campType={campTemplate.camp_type} />
        )}

        {/* Learning Formats */}
        {campTemplate.learning_formats && campTemplate.learning_formats.length > 0 && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">上课形式</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                多样化学习体验，全方位成长支持
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campTemplate.learning_formats.map((format: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 bg-white/80 border-purple-100">
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

        {/* Benefits */}
        {campTemplate.benefits && campTemplate.benefits.length > 0 && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">你将获得</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) 
                  ? '实实在在的成长' 
                  : `${campTemplate.duration_days}天后，实实在在的成长`
                }
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campTemplate.benefits.map((benefit: string, index: number) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 bg-white/80 border-purple-100">
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
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">适合加入的人</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                如果你有以下困扰或期待，这个训练营就是为你设计的
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {campTemplate.target_audience.map((audience: string, index: number) => (
                <Card 
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 bg-white/80 border-purple-100"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
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
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 max-w-2xl mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-lg">
                  <Users className="w-5 h-5" />
                  <span>报名条件</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  {campTemplate.prerequisites.message}
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-purple-100 z-20">
        <div className="container max-w-lg mx-auto">
          <Button 
            size="lg" 
            onClick={() => {
              if (hasJoinedCamp && existingCamp) {
                navigate(`/camp-checkin/${existingCamp.id}`);
              } else {
                setShowStartDialog(true);
              }
            }}
            className={`w-full gap-2 bg-gradient-to-r ${campTemplate.gradient} hover:opacity-90 text-white shadow-lg text-lg py-6`}
          >
            {hasJoinedCamp ? '继续训练' : '立即加入训练营'}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={campTemplate}
        onSuccess={(campId) => navigate(`/camp-checkin/${campId}`)}
      />
    </div>
  );
};

export default CampIntro;
