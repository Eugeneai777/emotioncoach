import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Target, Users, Sparkles, Calendar, MessageCircle, Heart, TrendingUp, CheckCircle2 } from "lucide-react";

const UserManual = () => {
  const navigate = useNavigate();

  // 核心价值
  const coreValues = [
    { icon: Heart, title: "温暖陪伴与真实关系", description: "理解你的痛点" },
    { icon: Target, title: "系统工具与可执行方法", description: "给你能做到的行动" },
    { icon: Users, title: "社群连接与成长支持", description: "让改变可持续发生" }
  ];

  // 五大核心能力
  const coreAbilities = [
    {
      title: "情绪管理能力",
      emoji: "🎯",
      features: ["情绪日记", "情绪四部曲（觉察→理解→反应→转化）", "情绪复盘", "今日洞察", "今日行动", "今日成长故事"],
      gradient: "from-rose-500/10 to-pink-500/10"
    },
    {
      title: "每日成长能力",
      emoji: "🌱",
      features: ["今日能量宣言", "宣言卡", "有劲日报", "有劲周报"],
      gradient: "from-green-500/10 to-teal-500/10"
    },
    {
      title: "测评能力",
      emoji: "📊",
      features: ["有劲能量测评（共振/觉醒/升维）"],
      gradient: "from-purple-500/10 to-indigo-500/10"
    },
    {
      title: "AI 生活智慧回答",
      emoji: "💡",
      features: ["情绪与压力", "关系沟通", "家庭教育", "职场困境", "决策分析", "时间与目标管理", "自我怀疑、自卑、焦虑等心理状况"],
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      title: "社群共振与教练支持",
      emoji: "🤝",
      features: ["绽放故事（真实成长见证）", "Harvuta 深度对话", "每周成长直播", "小组支持"],
      gradient: "from-orange-500/10 to-yellow-500/10"
    }
  ];

  // 每日使用流程
  const dailyFlow = [
    { step: 1, title: "早晨能量宣言", time: "2分钟", description: "用声音唤醒能量", icon: "🌅" },
    { step: 2, title: "情绪觉察", time: "3分钟", description: "记录当下真实感受", icon: "💭" },
    { step: 3, title: "AI 对话引导", time: "3分钟", description: "深度理解情绪根源", icon: "🤖" },
    { step: 4, title: "今日洞察与行动", time: "2分钟", description: "获得清晰的行动指引", icon: "✨" }
  ];

  // 21天训练营亮点
  const campHighlights = [
    { day: "第1天", milestone: "启程", description: "开启改变之旅", icon: "🌱" },
    { day: "第7天", milestone: "习惯养成", description: "形成稳定节奏", icon: "⭐" },
    { day: "第14天", milestone: "能力突破", description: "看见明显变化", icon: "🌟" },
    { day: "第21天", milestone: "毕业成长", description: "完成蜕变", icon: "🏆" }
  ];

  // 科学数据
  const scientificData = [
    { metric: "连续21天记录情绪", result: "焦虑下降 31%" },
    { metric: "给情绪命名", result: "决策清晰度提升 40%" },
    { metric: "持续书写", result: "睡眠改善 28%" },
    { metric: "写下行动", result: "行动力提升 2.4倍" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                有劲 AI · 情绪日记使用手册
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/camp-intro")}
              className="gap-2"
            >
              开始训练营
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-fade-in">
          <div className="inline-block text-6xl mb-4">📖</div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warm bg-clip-text text-transparent">
            把情绪变力量，让你天天都有劲
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            一位懂你、陪你、帮你成长的生活教练
          </p>
        </section>

        {/* 使命与愿景 */}
        <section className="space-y-8">
          <Card className="overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/20 to-warm/20 rounded-full">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">使命</span>
                </div>
                <p className="text-2xl font-bold">让好的行为变得简单，让更好的自己成为必然</p>
              </div>
              <div className="text-center space-y-4 pt-4 border-t">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent/20 to-warm/20 rounded-full">
                  <Target className="w-5 h-5 text-accent" />
                  <span className="text-lg font-semibold">愿景</span>
                </div>
                <p className="text-2xl font-bold">让有劲 AI 成为每个人的生活教练</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 核心价值 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">核心价值</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreValues.map((value, index) => (
              <Card key={index} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 科学数据 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">科学研究证实</h3>
            <p className="text-muted-foreground">记录情绪 = 最快的改善路径</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scientificData.map((data, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <span className="font-medium">{data.metric}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{data.result}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 五大核心能力 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">五大核心能力</h3>
            <p className="text-muted-foreground">全方位支持你的成长</p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {coreAbilities.map((ability, index) => (
              <Card key={index} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`bg-gradient-to-r ${ability.gradient} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{ability.emoji}</span>
                    <h4 className="text-2xl font-bold">{ability.title}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ability.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 每日使用流程 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">每日使用流程</h3>
            <p className="text-muted-foreground">每天只需 10 分钟</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dailyFlow.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-full" />
                <CardHeader className="relative">
                  <div className="text-4xl mb-2">{step.icon}</div>
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <div className="text-sm text-primary font-semibold">{step.time}</div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 21天训练营 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">21 天情绪日记训练营</h3>
            <p className="text-muted-foreground">完整成长路径</p>
          </div>
          <Card className="overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {campHighlights.map((highlight, index) => (
                  <div key={index} className="text-center space-y-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="text-5xl mb-2">{highlight.icon}</div>
                    <div className="text-sm font-semibold text-primary">{highlight.day}</div>
                    <div className="text-xl font-bold">{highlight.milestone}</div>
                    <div className="text-sm text-muted-foreground">{highlight.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-8 py-12">
          <Card className="max-w-3xl mx-auto overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-12 space-y-6">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-3xl font-bold">准备好开始你的成长之旅了吗？</h3>
              <p className="text-lg text-muted-foreground">
                你不是一个人在改变，是一群人一起共振改变
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/camp-intro")}
                  className="gap-2 bg-gradient-to-r from-primary to-warm hover:opacity-90"
                >
                  <Calendar className="w-4 h-4" />
                  开始 21 天训练营
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/energy-studio")}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  探索生活馆工具
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default UserManual;
