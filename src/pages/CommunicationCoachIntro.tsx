import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageCircle,
  Eye,
  Heart,
  Lightbulb,
  Zap,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import React from "react";

const CommunicationCoachIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/communication-coach");
    } else {
      navigate("/auth");
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // 痛点数据
  const painPoints = [
    "明明是为对方好，说出来却变成吵架",
    "想表达需求，却总被误解或无视",
    "说话容易得罪人，关系变得紧张",
    "有话不敢说，憋着更难受"
  ];

  // 核心价值
  const coreValues = [
    {
      icon: Eye,
      title: "看清沟通问题，不再糊里糊涂",
      description: "卡内基沟通教练帮你拆解：谁在意什么？误会从哪来？为什么讲不通？"
    },
    {
      icon: MessageCircle,
      title: "教你一句「对方愿意听」的表达",
      description: "不是大道理，不是沟通术，而是立刻能用的一句话"
    },
    {
      icon: Sparkles,
      title: "每天一个 30 秒练习，让关系每天好一点",
      description: "沟通不是天赋，是习惯。卡内基沟通教练陪你每天练一点、变一点"
    }
  ];

  // 理论基础
  const theoreticalBasis = [
    { icon: Heart, text: "人性需求模型（尊重、安全感、价值感）" },
    { icon: Target, text: "情绪与防御机制" },
    { icon: Lightbulb, text: "人际理解与框架转换" },
    { icon: MessageCircle, text: "影响力与表达心理学" },
    { icon: Zap, text: "行为科学中的微行动模型" }
  ];

  // 四步沟通模型
  const fourStepsModel = [
    {
      step: "1️⃣",
      title: "看见（See）",
      description: "把情绪化故事拆解成清晰的沟通问题",
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: "2️⃣",
      title: "读懂（Understand）",
      description: "从人性角度读懂对方的需求与动机",
      color: "from-purple-500 to-pink-500"
    },
    {
      step: "3️⃣",
      title: "影响（Influence）",
      description: "告诉你一句「对方愿意听」的表达方式",
      color: "from-orange-500 to-red-500"
    },
    {
      step: "4️⃣",
      title: "行动（Act）",
      description: "给你一个今天就能完成的沟通微行动",
      color: "from-green-500 to-emerald-500"
    }
  ];

  // 为什么需要它
  const whyNeedIt = [
    "没时间学理论？它给你一句能立刻用的话",
    "没经验？它帮你看懂对方在想什么",
    "不知道怎么表达？它教你用最安全的方式开口",
    "想变更会沟通？它陪你练 21 天"
  ];

  // 适用人群
  const targetAudience = [
    "想让关系更顺畅的人",
    "想学会「怎么说对方才听得进去」的人",
    "被误会、被冷淡、被拒绝时容易焦虑的人",
    "与老板／伴侣／孩子沟通困难的人",
    "不会拒绝、不会表达需求的人",
    "想提升影响力、表达力、说服力的人"
  ];

  // 使用成果
  const expectedResults = [
    { icon: MessageCircle, text: "说话更有条理" },
    { icon: Lightbulb, text: "更知道怎么开口" },
    { icon: Heart, text: "更能理解对方" },
    { icon: TrendingUp, text: "冲突明显减少" },
    { icon: Target, text: "管理情绪更容易" },
    { icon: Zap, text: "表达需求变得自然" },
    { icon: Users, text: "人际关系轻松多了" },
    { icon: CheckCircle2, text: "更容易被合作、被信任" }
  ];

  // FAQ数据
  const faqItems = [
    {
      question: "卡内基沟通教练和普通沟通课有什么不同？",
      answer: "普通课程教理论，我们教你一句能立刻用的话。卡内基沟通教练实时分析你的真实场景，给你个性化的表达建议，而不是让你背模板。"
    },
    {
      question: "我不擅长表达，卡内基沟通教练能帮我吗？",
      answer: "能。卡内基沟通教练会先帮你看清对方的需求和你的真实想法，然后给你一句最安全、最容易被接受的表达方式。你只需要照着说就行。"
    },
    {
      question: "需要每天都使用吗？",
      answer: "不强制，但建议每周至少 2-3 次。越频繁练习，沟通习惯形成得越快。每次只需要 5-10 分钟。"
    },
    {
      question: "卡内基沟通教练给的建议真的有用吗？",
      answer: "建议基于你描述的具体场景、对方的性格特点和你们的关系状态，是定制化的。很多用户反馈说「这句话真的好用」「对方真的听进去了」。"
    },
    {
      question: "如果对方根本不想听怎么办？",
      answer: "卡内基沟通教练会帮你分析对方为什么不想听，是时机不对、方式不对，还是需求没对齐。然后告诉你什么时候、用什么方式说，对方更容易打开心门。"
    },
    {
      question: "我可以用在工作场景吗？",
      answer: "可以。无论是和老板、同事、客户沟通，还是和家人、伴侣、孩子沟通，都适用。卡内基沟通教练会根据关系类型给出不同的建议。"
    },
    {
      question: "会不会让我说话变得很功利？",
      answer: "不会。我们教的不是「话术」，而是帮你找到既真诚、又能被接受的表达方式。目标是让关系更好，不是操控对方。"
    },
    {
      question: "如果我说了建议的话，对方还是不听呢？",
      answer: "沟通不是一次就能解决的。卡内基沟通教练会教你如何一步步建立信任、调整策略，而不是指望一句话就改变一切。"
    },
    {
      question: "我可以把对话记录分享给朋友吗？",
      answer: "可以，但建议只分享你的学习收获和成长，而不是直接转发别人的隐私对话。"
    },
    {
      question: "如果我连问题都说不清楚怎么办？",
      answer: "没关系。卡内基沟通教练会通过提问帮你一步步理清：发生了什么、你想要什么、对方在意什么。你只需要把模糊的感觉说出来就行。"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 模块1: Hero Banner */}
      <section className="relative overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100 opacity-60"></div>
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="text-6xl mb-4">💬</div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              卡内基沟通教练
            </h1>
            <p className="text-xl md:text-2xl text-foreground font-semibold">
              让你说得更清晰、关系更顺畅、对方更愿意听
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              基于经典沟通学、人性洞察与行为心理学打造的 AI 智能沟通教练，陪你把"会说话"变成长期习惯
            </p>
            
            {/* CTA按钮 */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="hover:scale-105 transition-transform">
                立即体验沟通教练
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('four-steps')}>
                了解四步曲
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 模块2: 痛点共鸣 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            这些场景，是不是很熟悉？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((point, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <p className="text-lg text-foreground">{point}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-8 text-base">
            不是你不会说话，是没人教你怎么说对方才愿意听
          </p>
        </div>
      </section>

      {/* 模块3: 核心价值 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            3 大核心价值
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <Card key={index} className="hover:shadow-2xl transition-all duration-300 hover:scale-[1.05]">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                      <value.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center">{value.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 模块4: 品牌定位 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            融合多种沟通原理
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            《卡内基沟通教练》融合了多种公认的沟通原理，并参考了多位沟通学与心理学大师的理念，但不引用任何特定课程或受版权保护的内容。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {theoreticalBasis.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 模块5: 四步沟通模型 */}
      <section id="four-steps" className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            卡内基沟通教练的核心能力：四步沟通模型
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            通过 See → Understand → Influence → Act 帮助你解决每个真实场景
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {fourStepsModel.map((step, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]">
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5`}></div>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{step.step}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Badge variant="outline" className="text-sm px-6 py-3">
              这是我们自主设计的模型，不源自任何外部课程，100%原创，可商用
            </Badge>
          </div>
        </div>
      </section>

      {/* 模块6: 为什么需要它 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            为什么它是你需要的沟通教练？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyNeedIt.map((reason, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">{reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 模块7: 适用人群 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            适用人群
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {targetAudience.map((audience, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-base px-6 py-3 hover:scale-105 transition-transform cursor-default"
              >
                {audience}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* 模块8: 使用成果 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            使用成果
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {expectedResults.map((result, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.05]">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <result.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <p className="font-medium">{result.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 模块9: FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            常见问题
          </h2>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 模块10: 最终CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            开始用卡内基沟通教练，让关系更顺畅
          </h2>
          <p className="text-lg text-muted-foreground">
            只需要说出你的困境，卡内基沟通教练就会陪你找到更好的表达方式
          </p>
          <Button size="lg" onClick={handleGetStarted} className="mt-6 hover:scale-105 transition-transform">
            立即开始
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CommunicationCoachIntro;
