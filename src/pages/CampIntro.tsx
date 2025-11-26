import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Target,
  Heart,
  MessageCircle,
  Shield,
  Award,
  Clock
} from "lucide-react";

const CampIntro = () => {
  const navigate = useNavigate();

  const stats = [
    {
      icon: <TrendingDown className="w-8 h-8" />,
      label: "焦虑下降",
      value: "31%",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      label: "决策清晰度提升",
      value: "40%",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: <Moon className="w-8 h-8" />,
      label: "睡眠改善",
      value: "28%",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      label: "执行力提升",
      value: "2.4倍",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const dailyPractice = [
    {
      time: "☀️ 早上",
      title: "今日宣言卡",
      duration: "1分钟",
      content: "AI生成专属宣言，分享建立正向暗示",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      time: "🌤️ 白天",
      title: "记录情绪",
      duration: "2-3分钟",
      content: "命名情绪、找触发点、看见需求",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      time: "🌙 晚上",
      title: "情绪复盘",
      duration: "6分钟",
      content: "今日梳理、洞察、行动、成长故事",
      gradient: "from-indigo-600 to-purple-600"
    }
  ];

  const weeklyActivities = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Harvuta 小组讨论",
      description: "双人深度学习法，相互提问、倾听",
      color: "text-pink-500"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "每周成长直播",
      description: "学员分享 + 教练示范 + 答疑",
      color: "text-blue-500"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "自动周报",
      description: "情绪趋势 + 洞察总结",
      color: "text-purple-500"
    }
  ];

  const benefits = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "情绪更稳定",
      description: "少被情绪困扰，不再大起大落"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "思维更清晰",
      description: "看问题更透彻，决策更果断"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "行动力更强",
      description: "不再拖延，说干就干"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "关系更顺畅",
      description: "沟通更有效，减少误解冲突"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "自信更提升",
      description: "相信自己，面对挑战更从容"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "获得成长档案",
      description: "看见自己21天的蜕变轨迹"
    }
  ];

  const targetAudience = [
    "经常焦虑、压力大的人",
    "情绪敏感、容易受影响",
    "脑袋混乱、思绪停不下来",
    "想提升决策力的人",
    "想改善人际关系",
    "想养成好习惯但总失败",
    "对自我成长有兴趣",
    "想系统学习情绪管理"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
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
          <div className="inline-block">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1 text-sm">
              🏕️ 21天养成计划
            </Badge>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              21天情绪日记训练营
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              每天10分钟，让情绪变成你的力量
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/")}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
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

        {/* Research Stats */}
        <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">为什么需要情绪日记？</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              多项研究表明，坚持情绪记录能显著改善心理健康和生活质量
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden border-2 hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className={`text-4xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Daily Practice */}
        <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">每日练习流程</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              简单三步，只需10分钟，轻松完成每日情绪管理
            </p>
          </div>
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 rounded-full -translate-y-1/2 -z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {dailyPractice.map((practice, index) => (
                <Card 
                  key={index}
                  className="group relative overflow-hidden bg-card/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${practice.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
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
          </div>
        </section>

        {/* Weekly Activities */}
        <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">每周社群共振</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              不只是独自练习，在社群中一起成长、相互支持
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weeklyActivities.map((activity, index) => (
              <Card 
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`${activity.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {activity.icon}
                  </div>
                  <CardTitle className="text-xl">{activity.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{activity.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">训练营带来的改变</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              21天后，你将获得这些实实在在的成长
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{benefit.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {benefit.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Target Audience */}
        <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">适合加入的人</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              如果你有以下困扰，这个训练营就是为你设计的
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
            {targetAudience.map((audience, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="px-4 py-2 text-sm border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-default animate-in fade-in-50"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Check className="w-4 h-4 mr-2 text-primary" />
                {audience}
              </Badge>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-12 text-center text-white animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              开始你的21天情绪觉醒之旅
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              每天10分钟，从情绪混乱到内心清晰，从被动反应到主动选择
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
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
          <p>© 2024 有劲生活馆. 让情绪成为你的力量</p>
        </div>
      </footer>
    </div>
  );
};

export default CampIntro;
