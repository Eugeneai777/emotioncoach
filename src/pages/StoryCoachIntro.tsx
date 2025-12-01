import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, BookOpen, Users, Zap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const StoryCoachIntro = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/story-coach");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scientificResearch = [
    {
      icon: "📝",
      title: "写故事能显著降低焦虑与压力",
      researcher: "Pennebaker 40年研究",
      findings: [
        "每次写 15–20 分钟连续 3 天",
        "焦虑降低 25–38%",
        "免疫力显著上升",
        "睡眠质量改善"
      ],
      insight: "把经历写成故事结构，是最有效的情绪整合方式。",
      source: "Pennebaker, J. W. Writing to Heal, 2000."
    },
    {
      icon: "🧠",
      title: "写故事让大脑从混乱 → 清晰",
      researcher: "UCLA研究",
      findings: [
        "大脑从杏仁核（情绪区）→ 前额叶（思考区）",
        "你更冷静",
        "更能理解自己",
        "更容易行动"
      ],
      insight: "当你把情绪写成完整的故事，大脑会重新整理。",
      source: "Lieberman, M. D. \"Putting Feelings Into Words\", Psychological Science, 2007."
    },
    {
      icon: "📊",
      title: "故事比数据更能影响别人",
      researcher: "Stanford大学",
      findings: [
        "只有数据 → 人只记住 5%",
        "用故事讲数据 → 人能记住 65%",
        "故事的传播速度为数字资讯的 22 倍"
      ],
      insight: "故事 = 最强的说服工具。",
      source: "Stanford Persuasive Technology Lab, 2015."
    },
    {
      icon: "🎬",
      title: "英雄之旅是全球最有效的\"改变模型\"",
      researcher: "Pixar",
      findings: [
        "所有剧本会议必须回答：「主角如何被改变？」",
        "全球 70% 的畅销电影、动画、甚至 TED 演讲都采用 Campbell 英雄之旅结构"
      ],
      insight: "英雄之旅是最强大的改变框架。",
      source: "Pixar Story Rules（Emma Coats 发布）"
    },
    {
      icon: "💎",
      title: "故事是一个人的\"价值证明\"",
      researcher: "McAdams",
      findings: [
        "人们对一个人的价值判断，不是看头衔，而是看他的故事",
        "故事 = 你经历过的挑战 × 你成长出的能力 × 你对他人的影响"
      ],
      insight: "故事决定你是谁。",
      source: "McAdams, D. The Stories We Live By, 1993."
    }
  ];

  const campbellPoints = [
    { emoji: "🗺️", text: "每个人活的不是生活，而是\"旅程\"" },
    { emoji: "📢", text: "每个困境都是\"召唤\"" },
    { emoji: "💡", text: "每个转折都是\"觉醒\"" },
    { emoji: "⚒️", text: "每段成长都是\"锻造\"" },
    { emoji: "🎁", text: "最重要的不是征服，而是\"带着智慧回来帮助他人\"" }
  ];

  const fourSteps = [
    {
      step: "1️⃣",
      title: "问题 · The Problem",
      subtitle: "故事的开始",
      questions: [
        "发生了什么？",
        "哪些情绪最明显？",
        "哪个事件让你停下来？"
      ],
      insight: "这是你的\"召唤\"。",
      color: "from-red-500 to-orange-500"
    },
    {
      step: "2️⃣",
      title: "转折 · The Turning",
      subtitle: "觉醒时刻",
      questions: [
        "哪个瞬间你不想再这样下去？",
        "谁给了你一句话？",
        "你突然意识到了什么？"
      ],
      insight: "这是你\"走出舒适圈的选择\"。",
      color: "from-orange-500 to-amber-500"
    },
    {
      step: "3️⃣",
      title: "成长 · The Growth",
      subtitle: "真正的旅程",
      questions: [
        "你经历了什么挑战？",
        "学到了什么能力？",
        "哪些盲点被你看见？"
      ],
      insight: "这是你\"能力的锻造期\"。",
      color: "from-amber-500 to-yellow-500"
    },
    {
      step: "4️⃣",
      title: "反思 & 向导觉醒 · The Reflection",
      subtitle: "使命",
      questions: [
        "这段经历给了你什么洞察？",
        "它如何塑造了现在的你？",
        "你想把智慧带给谁？"
      ],
      insight: "这是你\"成为向导的时刻\"。",
      color: "from-yellow-500 to-green-500"
    }
  ];

  const creationMethods = [
    {
      emoji: "📋",
      title: "从简报开始",
      subtitle: "基于情绪与成长记录",
      description: "自动抓取你的：",
      features: ["情绪曲线", "重大事件", "宣言卡", "行动习惯"],
      result: "生成一个\"故事骨干简报\"。"
    },
    {
      emoji: "💬",
      title: "教练问答",
      subtitle: "四步曲引导",
      description: "逐题问答，教练陪你挖掘故事核心：",
      features: ["完整版故事", "3 个标题", "60 / 120 / 300 字版本", "成长点总结"],
      result: "AI 即时生成结构化故事。"
    },
    {
      emoji: "📝",
      title: "自由整理",
      subtitle: "AI自动结构化",
      description: "你写任意内容——一句、一段、一篇。",
      features: ["情绪故事", "成长故事", "英雄之旅故事"],
      result: "AI 自动整理成专业故事结构。"
    }
  ];

  const faqItems = [
    { question: "我不会写故事，可以吗？", answer: "可以。你只要回答问题，AI 会帮你结构化。" },
    { question: "我的经历很普通，也能写吗？", answer: "能。英雄从来不是一开始伟大，而是因为经历而成长。" },
    { question: "写故事会不会太私人？", answer: "不会公开，除非你自己选择分享。" },
    { question: "写故事会让我情绪更糟吗？", answer: "不会。研究显示，结构化表达反而能降低情绪压力。" },
    { question: "一篇故事要花多久？", answer: "5–10 分钟（简版）/ 15–30 分钟（深度版）" },
    { question: "我遇到的都是痛苦，写得出来吗？", answer: "可以。我们不会让你重演，而是帮助你看见意义与成长。" },
    { question: "我的故事能成为改变别人的力量吗？", answer: "是的。故事是最强的\"希望传递器\"。" },
    { question: "能拿来做面试、自我介绍、个人品牌吗？", answer: "完全可以。故事比履历更能说服人。" },
    { question: "写故事有什么具体好处？", answer: "清晰头脑、缓解压力、提升自信、看见成长、影响他人（成为向导）" },
    { question: "为什么故事决定我的价值？", answer: "因为一个人的价值，不是头衔，而是他走过的路与留下的智慧。你的故事 = 你的价值。" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-950/20 dark:via-amber-950/10 dark:to-yellow-950/20 opacity-60"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/story-coach")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回故事教练
          </Button>

          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="text-5xl md:text-6xl mb-4">🌟</div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              说好故事教练
            </h1>
            <p className="text-xl md:text-2xl text-foreground font-semibold">
              英雄之旅 × 向导觉醒
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              用科学方法，把你的经历变成动人的成长故事
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                <Sparkles className="w-5 h-5" />
                立即体验故事教练
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('four-steps')}>
                了解四步曲
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 为什么故事重要 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 为什么故事这么重要？
            </h2>
            <p className="text-xl text-muted-foreground mb-2">学术数据 + 科学来源</p>
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800 max-w-3xl mx-auto">
              <CardContent className="p-6">
                <p className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                  写下你的故事，不是为了记录人生，而是为了改变人生。
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scientificResearch.map((research, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4 text-center">{research.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{research.title}</h3>
                  <p className="text-sm text-primary font-semibold mb-3">{research.researcher}</p>
                  <ul className="space-y-2 mb-4">
                    {research.findings.map((finding, i) => (
                      <li key={i} className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-muted p-3 rounded-lg mb-3">
                    <p className="text-sm italic">{research.insight}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{research.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-300 dark:border-orange-700 max-w-3xl mx-auto">
              <CardContent className="p-8">
                <p className="text-xl font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                  ✨ 故事不是附加品，而是你的核心竞争力。<br/>
                  故事决定：你是谁、你能影响谁、你在别人心里留下什么。<br/>
                  你的故事越清晰，你的影响力越大。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 英雄之旅理论 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-cyan-50/30 to-background dark:from-cyan-950/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            🧭 英雄之旅：为什么每个人的故事如此重要？
          </h2>
          
          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800 mb-8">
            <CardContent className="p-8 text-center">
              <p className="text-xl italic text-cyan-800 dark:text-cyan-300 mb-4">
                "所有伟大的故事都遵循同一条路径：<br/>
                从困境开始，经由试炼觉醒，带着智慧返回人群。"
              </p>
              <p className="text-muted-foreground font-medium">— Joseph Campbell《千面英雄》</p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {campbellPoints.map((point, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-3">{point.emoji}</div>
                  <p className="text-sm font-medium leading-snug">{point.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 向导角色 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            🧭 英雄之旅中最重要的角色：向导（Mentor）
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🧙‍♂️</div>
              <p className="font-semibold">甘道夫</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🧙</div>
              <p className="font-semibold">邓布利多</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">👽</div>
              <p className="font-semibold">尤达大师</p>
            </Card>
          </div>
          
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg text-purple-800 dark:text-purple-300">
                他们的任务不是替英雄解决问题，<br/>
                而是在关键时刻点亮方向。
              </p>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <p className="text-purple-700 dark:text-purple-300 font-semibold">
                  在"有劲AI"里，所有 AI 教练就是你的向导。<br/>
                  帮助你看见情绪、找到盲点、迈向成长。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 向导觉醒 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-purple-50/30 to-background dark:from-purple-950/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            🕊️ 而当你写下自己的故事，你马上成为"别人的向导"
          </h2>
          
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-300 dark:border-purple-700 mb-8">
            <CardContent className="p-8">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-2 font-semibold">英雄之旅的最后阶段</p>
              <h3 className="text-2xl md:text-3xl font-bold text-purple-800 dark:text-purple-300 mb-6">
                Return with the Elixir<br/>
                带着智慧返回人群
              </h3>
              <div className="space-y-4 text-lg text-purple-700 dark:text-purple-300">
                <p className="font-semibold">你的故事，是别人重新出发的勇气。</p>
                <p>你不是在分享结果，你是在分享<strong>你是如何走出来的</strong>。</p>
                <div className="bg-purple-200 dark:bg-purple-900/40 p-4 rounded-lg mt-4">
                  <p className="font-bold text-purple-900 dark:text-purple-200">
                    这就是你故事的真正使命：<br/>让别人透过你，看见希望。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 四步曲 */}
      <section id="four-steps" className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🌪️ 四步曲：说好故事的黄金结构
            </h2>
            <p className="text-lg text-muted-foreground">
              将英雄之旅化为人人能用的 4 步结构
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fourSteps.map((step, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{step.step}</div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">{step.subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold mb-3 text-foreground">关键问题：</p>
                    <ul className="space-y-2">
                      {step.questions.map((q, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <span className="mr-2 text-primary">→</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={`bg-gradient-to-r ${step.color} p-3 rounded-lg text-white`}>
                    <p className="text-sm font-semibold text-center">{step.insight}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 三种创作方式 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-amber-50/30 to-background dark:from-amber-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🛠️ 三种创作方式
            </h2>
            <p className="text-lg text-muted-foreground">
              让人人都能写出一个强大故事
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creationMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="text-5xl mb-4 text-center">{method.emoji}</div>
                  <h3 className="text-xl font-bold mb-2 text-center">{method.title}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 font-medium">{method.subtitle}</p>
                  
                  <p className="text-sm mb-3">{method.description}</p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <ul className="space-y-2">
                      {method.features.map((feature, i) => (
                        <li key={i} className="text-sm flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-primary">{method.result}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ❓ 常见问题
            </h2>
            <p className="text-lg text-muted-foreground">
              10 个最常见的疑惑
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 最终CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Card className="bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-orange-300 dark:border-orange-700">
            <CardContent className="p-8">
              <p className="text-xl md:text-2xl font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                🌈 当你写下你的故事，你不仅看见自己，也照亮别人。<br/>
                你走过的路，会成为别人的光。
              </p>
            </CardContent>
          </Card>
          
          <h2 className="text-3xl md:text-4xl font-bold">
            开始用故事教练，把经历变成力量
          </h2>
          <p className="text-lg text-muted-foreground">
            只需要说出你的故事，教练就会陪你把它变成动人的成长叙事
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              立即开始创作
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/my-stories")} className="gap-2 text-lg">
              <Users className="w-5 h-5" />
              查看我的故事
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoryCoachIntro;
