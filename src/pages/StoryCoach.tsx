import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoachHeader } from "@/components/coach/CoachHeader";
import StoryCreationFlow from "@/components/coach/StoryCreationFlow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HERO_JOURNEY_STAGES = [
  {
    icon: "🌪️",
    title: "问题",
    subtitle: "The Problem",
    description: "故事的开始，遇到的挑战或困境",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: "💡",
    title: "转折",
    subtitle: "The Turning",
    description: "关键时刻，新的思考与选择",
    color: "from-amber-500 to-amber-600"
  },
  {
    icon: "🌱",
    title: "成长",
    subtitle: "The Growth",
    description: "经历之后，对自己的新认识",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    icon: "✨",
    title: "反思",
    subtitle: "The Reflection",
    description: "总结收获，对未来的展望",
    color: "from-orange-400 to-amber-400"
  }
];

export default function StoryCoach() {
  const navigate = useNavigate();
  const [showCreation, setShowCreation] = useState(false);

  const handleComplete = async (data: { title: string; story: string; emotionTag?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        navigate("/auth");
        return;
      }

      // Save to community_posts
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.story,
          post_type: 'story',
          emotion_theme: data.emotionTag,
          visibility: 'public'
        });

      if (error) throw error;

      toast.success("故事已保存！");
      setShowCreation(false);
      
      // Optionally navigate to community or history
      navigate("/community");
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error("保存失败，请重试");
    }
  };

  const handleRestart = () => {
    setShowCreation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/50 to-white dark:from-orange-950/20 dark:via-amber-950/10 dark:to-background">
      <CoachHeader
        emoji="📖"
        primaryColor="orange"
        hasMessages={showCreation}
        onRestart={handleRestart}
        onSignOut={() => {
          supabase.auth.signOut();
          navigate("/auth");
        }}
        historyRoute="/community"
        historyLabel="故事广场"
        showNotificationCenter={false}
      />

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {!showCreation ? (
          <>
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  故事教练
                </h1>
                <p className="text-muted-foreground mt-2">
                  用英雄之旅的方法，把你的经历变成动人的成长故事
                </p>
              </div>
            </div>

            {/* Hero Journey Introduction */}
            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-bold">英雄之旅四部曲</h2>
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500">Hero's Journey</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {HERO_JOURNEY_STAGES.map((stage, index) => (
                    <Card 
                      key={index} 
                      className="border-2 hover:shadow-lg transition-all bg-white/50 dark:bg-background/50"
                    >
                      <CardContent className="pt-6 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${stage.color} flex items-center justify-center text-2xl`}>
                            {stage.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{stage.title}</h3>
                            <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground pl-15">
                          {stage.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowCreation(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    <BookOpen className="h-5 w-5" />
                    开始创作我的故事
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: "📋", title: "从简报开始", desc: "基于历史情绪记录创作" },
                { icon: "💬", title: "教练引导", desc: "四步问答式创作流程" },
                { icon: "📝", title: "自由整理", desc: "输入内容AI帮你结构化" }
              ].map((feature, i) => (
                <Card key={i} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-2">
                    <div className="text-4xl">{feature.icon}</div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <StoryCreationFlow onComplete={handleComplete} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
