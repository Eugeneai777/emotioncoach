import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { ArrowLeft, Heart, Eye, Brain, Zap, Users, MessageCircle, Target, Sparkles, BookOpen, Calendar } from "lucide-react";

const ParentCoachIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: coachConfig } = useCoachTemplate('parent');

  const handleGetStarted = () => {
    if (user) {
      navigate("/parent-coach");
    } else {
      navigate("/auth");
    }
  };

  // 痛点数据
  const painPoints = [
    "孩子一说话就让我火大，不知道为什么总是控制不住。",
    "明明想好好沟通，话一出口就变成了指责。",
    "孩子越来越不愿意和我说话，我感到很无力。",
    "不知道如何在情绪激动时保护亲子关系。"
  ];

  // 步骤图标和颜色映射
  const stepIcons = [Eye, Brain, Zap, Target];
  const stepColors = [
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-violet-400 to-violet-600",
    "from-fuchsia-400 to-fuchsia-600"
  ];
  
  // 详情内容（Intro页需要比数据库更丰富的说明）
  const stepDetails = [
    [
      "识别身体信号：心跳加速、呼吸变浅、肌肉紧绷",
      "给情绪命名：是焦虑、愤怒、还是失望？",
      "接纳当下状态：情绪没有对错，只是信号"
    ],
    [
      "情绪背后藏着什么需求？安全感、尊重、连结？",
      "这个情绪在保护什么重要的东西？",
      "孩子的行为触动了我的哪个按钮？"
    ],
    [
      "父母先稳，孩子才愿意走向你",
      "用你的平静去安抚孩子的不安",
      "成为孩子情绪的稳定锚点"
    ],
    [
      "用「我」开头表达感受，而非「你」开头指责",
      "给出选择而非命令",
      "表达期待而非批评"
    ]
  ];

  // 从数据库读取步骤标题，保留详细内容
  const fourSteps = (coachConfig?.steps as Array<{id: number; name: string; subtitle?: string; description?: string}> || []).map((step, index) => ({
    step: index + 1,
    title: step.name,
    subtitle: step.subtitle || ['Feel it', 'Understand it', 'Influence it', 'Act on it'][index],
    icon: stepIcons[index] || Eye,
    description: step.description || '',
    details: stepDetails[index] || [],
    color: stepColors[index]
  }));

  // 科学依据
  const scientificBasis = [
    {
      title: "依恋理论",
      author: "John Bowlby",
      description: "安全的亲子依恋是孩子心理健康发展的基础"
    },
    {
      title: "情绪调节共调理论",
      author: "Daniel Siegel",
      description: "父母的情绪稳定能帮助孩子学会调节自己的情绪"
    },
    {
      title: "正念育儿",
      author: "Jon Kabat-Zinn",
      description: "带着觉察和接纳与孩子相处，能改善亲子关系质量"
    },
    {
      title: "非暴力沟通",
      author: "Marshall Rosenberg",
      description: "通过表达感受和需求，建立真诚的连结"
    }
  ];

  // 适用场景
  const scenarios = [
    { emoji: "😤", title: "孩子发脾气", desc: "当孩子情绪失控时，如何保持冷静并有效引导" },
    { emoji: "🙄", title: "青春期叛逆", desc: "面对孩子的对抗和冷漠，如何重建信任" },
    { emoji: "📱", title: "手机/游戏冲突", desc: "在电子产品使用上，如何达成共识" },
    { emoji: "📚", title: "学习压力", desc: "如何在关心成绩的同时，保护孩子的心理健康" },
    { emoji: "🗣️", title: "沟通僵局", desc: "当对话陷入僵局时，如何打破沉默" },
    { emoji: "💔", title: "亲子冲突后", desc: "冲突发生后，如何修复关系" }
  ];

  // FAQ
  const faqs = [
    {
      question: "亲子情绪四部曲和普通情绪梳理有什么区别？",
      answer: "亲子情绪四部曲专门针对亲子互动场景设计，不仅帮助你处理自己的情绪，更重要的是帮助你理解孩子的需求，并找到既保护关系又能达到教育目的的沟通方式。"
    },
    {
      question: "我情绪激动时真的能冷静下来吗？",
      answer: "这需要练习。四部曲提供的是一个清晰的框架，让你在情绪激动时有一条可循的路径。随着练习增多，你会发现自己能更快地觉察和调整。"
    },
    {
      question: "孩子不配合怎么办？",
      answer: "四部曲首先改变的是你自己，而不是孩子。当你的状态稳定了，孩子会感受到安全，自然会更愿意走向你。记住：父母先稳，孩子才愿意走向你。"
    },
    {
      question: "多久能看到效果？",
      answer: "每个家庭情况不同，但很多家长反馈，坚持使用一周后，就能明显感受到自己的变化——更少发火、更多理解、更好的沟通。"
    },
    {
      question: "这适合所有年龄段的孩子吗？",
      answer: "是的，无论是幼儿、小学生还是青少年，四部曲的核心原则都适用。不同年龄段可能需要调整具体的沟通方式，AI会根据你的情况给出针对性建议。"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>亲子情绪教练 - 有劲AI</title>
        <meta name="description" content="亲子情绪四部曲，从觉察到行动，重建温暖亲子关系" />
        <meta property="og:title" content="有劲AI • 亲子教练" />
        <meta property="og:description" content="亲子情绪四部曲，从觉察到行动，重建温暖亲子关系" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-parent-coach.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/parent-coach-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-2 font-medium">亲子情绪教练介绍</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-violet-100 opacity-60"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium">
              <Users className="w-4 h-4" />
              亲子情绪教练
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-violet-600 bg-clip-text text-transparent">
              父母先稳，孩子才愿意走向你
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              用亲子情绪四部曲，从觉察到行动，重建温暖的亲子关系
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                开始使用亲子教练
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/parent-camp")}
              >
                了解 21 天训练营
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 痛点共鸣 */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            这些场景，你是不是很熟悉？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painPoints.map((point, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <p className="text-foreground">{point}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-6 text-sm">
            不是你不爱孩子，是情绪来临时，我们都需要一个方法。
          </p>
        </div>
      </section>

      {/* 四部曲介绍 */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              亲子情绪四部曲
            </h2>
            <p className="text-muted-foreground">
              从情绪失控到温柔回应，只需四步
            </p>
          </div>
          
          <div className="space-y-6">
            {fourSteps.map((step, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={`bg-gradient-to-r ${step.color} p-6 md:w-1/3 text-white`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm opacity-80">第 {step.step} 步</div>
                          <div className="font-bold text-lg">{step.title}</div>
                        </div>
                      </div>
                      <p className="text-sm opacity-90">{step.subtitle}</p>
                    </div>
                    
                    <div className="p-6 md:w-2/3">
                      <p className="font-medium mb-3">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 适用场景 */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            适用场景
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {scenarios.map((scenario, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{scenario.emoji}</div>
                  <h3 className="font-medium text-sm mb-1">{scenario.title}</h3>
                  <p className="text-xs text-muted-foreground">{scenario.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 科学依据 */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            科学依据
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scientificBasis.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{item.author}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            常见问题
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="bg-card border rounded-lg px-4">
                <AccordionTrigger className="text-left text-sm font-medium py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 训练营推荐 */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">21天亲子情绪训练营</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    系统提升亲子关系
                  </h3>
                  <p className="text-white/80 mb-4">
                    21天陪伴式学习，每天10分钟，让改变真正发生
                  </p>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate("/parent-camp")}
                    className="bg-white text-purple-600 hover:bg-white/90"
                  >
                    了解训练营详情
                  </Button>
                </div>
                <div className="text-6xl">👨‍👩‍👧</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">
            从今天开始，成为情绪稳定的父母
          </h2>
          <p className="text-muted-foreground mb-6">
            你的改变，是给孩子最好的礼物
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            开始使用亲子教练
          </Button>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default ParentCoachIntro;
