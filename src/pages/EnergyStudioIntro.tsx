import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Share2 } from "lucide-react";
import { tools, categories, getToolsByCategory, getToolCount, getCategoryCount } from "@/config/energyStudioTools";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

const EnergyStudioIntro = () => {
  const navigate = useNavigate();

  // 推荐使用场景
  const recommendedScenarios = [
    {
      title: "焦虑紧张时",
      emoji: "😰",
      tools: ["呼吸练习", "情绪急救箱", "正念练习"],
      gradient: "from-rose-500/10 to-pink-500/10"
    },
    {
      title: "迷茫困惑时",
      emoji: "🤔",
      tools: ["价值观探索", "优势发现", "人生愿景画布"],
      gradient: "from-purple-500/10 to-indigo-500/10"
    },
    {
      title: "想养成好习惯",
      emoji: "💪",
      tools: ["习惯追踪", "睡眠记录", "运动打卡"],
      gradient: "from-green-500/10 to-teal-500/10"
    },
    {
      title: "开启美好一天",
      emoji: "🌅",
      tools: ["能量宣言卡", "感恩日记"],
      gradient: "from-orange-500/10 to-yellow-500/10"
    }
  ];

  // 使用流程
  const usageSteps = [
    {
      step: 1,
      title: "进入生活馆",
      description: "从主页点击\"有劲生活馆\"入口",
      icon: "🏠"
    },
    {
      step: 2,
      title: "选择工具类别",
      description: "情绪工具、自我探索、生活管理",
      icon: "🎯"
    },
    {
      step: 3,
      title: "使用工具",
      description: "点击工具卡片开始使用",
      icon: "✨"
    },
    {
      step: 4,
      title: "追踪成长",
      description: "查看使用记录和成长数据",
      icon: "📈"
    }
  ];

  // 精选工具详细介绍
  const featuredTools = tools.filter(t => 
    ['declaration', 'breathing', 'first-aid', 'values'].includes(t.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <h1 className="text-sm font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
              有劲生活馆使用指南
            </h1>
            <IntroShareDialog config={introShareConfigs.energyStudio} />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-fade-in">
          <div className="inline-block text-4xl mb-2">🏛️</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-warm bg-clip-text text-transparent">
            有劲生活馆
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{getToolCount()}</span> 个精心设计的工具，助你实现情绪管理、自我探索与生活优化
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={() => navigate("/energy-studio")}
              className="gap-2 bg-gradient-to-r from-primary to-warm hover:opacity-90 w-full"
            >
              立即探索
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/camps")}
              className="w-full"
            >
              了解21天训练营
            </Button>
          </div>
        </section>

        {/* 使用流程 */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold">如何使用生活馆</h3>
            <p className="text-xs text-muted-foreground">四步开启你的成长之旅</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {usageSteps.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden border hover:border-primary/50 transition-all" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="relative p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{step.icon}</div>
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {step.step}
                    </div>
                  </div>
                  <CardTitle className="text-sm mt-1">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <CardDescription className="text-xs">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 工具分类介绍 */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">工具分类介绍</h3>
            <p className="text-muted-foreground">三大类别，全方位支持你的成长</p>
          </div>

          {categories.map((category, catIndex) => {
            const categoryTools = getToolsByCategory(category.id);
            return (
              <Card key={category.id} className="overflow-hidden border-2 animate-fade-in" style={{ animationDelay: `${catIndex * 150}ms` }}>
                <div className={`bg-gradient-to-r ${category.tabGradient} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{category.emoji}</div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold mb-2">
                        {category.name} ({getCategoryCount(category.id)} 个工具)
                      </h4>
                      <p className="text-white/90">{category.description}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">工具名称</th>
                          <th className="text-left py-3 px-4 font-semibold">核心功能</th>
                          <th className="text-left py-3 px-4 font-semibold">使用场景</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryTools.map((tool) => (
                          <tr key={tool.id} className="border-b last:border-0 hover:bg-accent/5 transition-colors">
                            <td className="py-3 px-4 font-medium">{tool.title}</td>
                            <td className="py-3 px-4 text-muted-foreground">{tool.description}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {tool.usageScenarios.join('、')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* 推荐使用场景 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">推荐使用场景</h3>
            <p className="text-muted-foreground">根据你的状态，快速找到合适的工具组合</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedScenarios.map((scenario, index) => (
              <Card key={scenario.title} className={`overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`bg-gradient-to-br ${scenario.gradient} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{scenario.emoji}</span>
                    <h4 className="text-2xl font-bold">{scenario.title}</h4>
                  </div>
                  <div className="space-y-2">
                    {scenario.tools.map((toolName) => (
                      <div key={toolName} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{toolName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 精选工具详细介绍 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">精选工具详解</h3>
            <p className="text-muted-foreground">深入了解我们的特色工具</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTools.map((tool, index) => (
              <Card key={tool.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} text-white`}>
                      <div className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 flex items-center gap-2">
                        {tool.title}
                        {tool.id === 'declaration' && (
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                            推荐
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {tool.detailedDescription}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">适用场景：</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.usageScenarios.map((scenario) => (
                        <span key={scenario} className="text-xs px-3 py-1 rounded-full bg-accent/50">
                          {scenario}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-8 py-12">
          <Card className="max-w-3xl mx-auto overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-12 space-y-6">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-3xl font-bold">准备好开始你的成长之旅了吗？</h3>
              <p className="text-lg text-muted-foreground">
                每个工具都经过精心设计，只为帮助你成为更好的自己
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/energy-studio")}
                  className="gap-2 bg-gradient-to-r from-primary to-warm hover:opacity-90"
                >
                  立即进入生活馆
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default EnergyStudioIntro;
