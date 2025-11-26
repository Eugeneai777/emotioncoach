import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check } from "lucide-react";
import {
  Heart,
  Compass,
  Users,
  Sun,
  Moon,
  PenLine,
  Calendar,
  TrendingDown,
  Brain,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Sparkles,
  BarChart as BarChartIcon,
  MessageCircle,
  Activity,
  Wallet,
} from "lucide-react";
import React from "react";

// 使用占位符图片
const heroChatMockup = "/placeholder.svg";
const featureWarmCompanion = "/placeholder.svg";
const featureSystematicMethod = "/placeholder.svg";
const featureCommunityResonance = "/placeholder.svg";

const Introduction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = React.useState<string | null>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  };

  const handleViewGuide = () => {
    navigate("/camp-guide");
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      toast({
        title: "复制成功",
        description: "快捷指令已复制到剪贴板",
      });
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      toast({
        title: "复制失败",
        description: "请手动复制指令",
        variant: "destructive",
      });
    }
  };

  // 痛点数据
  const painPoints = [
    "压力很大，却说不清到底在烦什么。",
    "脑子里很吵，睡前总是停不下来。",
    "常常重复同样的情绪与关系冲突。",
    "明明想改变，却找不到开始的方法。"
  ];

  // 核心特性
  const coreFeatures = [
    {
      image: featureWarmCompanion,
      title: "温暖陪伴",
      description: "随时聊一聊，理解你的情绪与真实需要。"
    },
    {
      image: featureSystematicMethod,
      title: "系统方法",
      description: "通过情绪日记、四部曲、日报周报，让成长有路径。"
    },
    {
      image: featureCommunityResonance,
      title: "社群共振",
      description: "绽放故事、训练营、小组支持，让改变不再孤单。"
    }
  ];

  // 科学依据
  const scientificData = [
    { duration: "21 天记录情绪", result: "焦虑下降 31%", icon: TrendingDown },
    { duration: "命名情绪", result: "决策清晰度提升 40%", icon: Brain },
    { duration: "持续书写", result: "睡眠改善 28%", icon: Moon },
    { duration: "写下行动", result: "执行力提升 2.4 倍", icon: Target }
  ];

  // AI工作流程
  const aiSteps = [
    { step: 1, title: "你说一句感受", desc: "烦躁、无力、委屈、空虚都可以。", icon: MessageCircle },
    { step: 2, title: "AI 命名情绪", desc: "帮你辨识焦虑？失落？恐惧？愤怒？", icon: Brain },
    { step: 3, title: "找出原因与需求", desc: "AI 会问对问题，帮你理解心里真正想表达的。", icon: Lightbulb },
    { step: 4, title: "给行动建议与今日洞察", desc: "当下做得到的小行动，让情绪真的被转化。", icon: Sparkles }
  ];

  // 每日流程
  const dailyRoutine = [
    { time: "早上 · 1 分钟", task: "看今日能量宣言，设定当天心态。", icon: Sun },
    { time: "白天 · 2–3 分钟", task: "任何情绪，用一句话写成情绪日记。", icon: PenLine },
    { time: "晚上 · 6 分钟", task: "AI 帮你做复盘，并生成《有劲日报》。", icon: Moon },
    { time: "每周一次", task: "自动生成《有劲周报》，看到自己的趋势。", icon: Calendar }
  ];

  // 功能概览
  const features = [
    { 
      icon: "📝", 
      title: "情绪日记（主入口）", 
      desc: "通过对话帮你梳理情绪、找到原因、给行动。",
      details: "情绪日记是有劲AI的核心功能，通过智能对话帮助你：",
      examples: [
        "说出一句感受，AI 会帮你命名情绪（焦虑、失落、愤怒等）",
        "通过追问找到情绪背后的真正原因",
        "基于你的需求，给出当下可执行的小行动",
        "自动生成情绪洞察，帮助你理解自己的模式"
      ]
    },
    { 
      icon: "📘", 
      title: "有劲日报 / 有劲周报", 
      desc: "自动整理：洞察、行动、趋势、故事。",
      details: "AI 自动为你生成结构化的成长报告：",
      examples: [
        "每日洞察：总结当天的情绪主题和收获",
        "行动清单：回顾你完成的行动和未完成的计划",
        "情绪趋势：可视化展示你的情绪变化曲线",
        "成长故事：用叙事方式记录你的改变历程"
      ]
    },
    { 
      icon: "🌈", 
      title: "每日能量宣言 + 宣言卡", 
      desc: "用一句话为你定调今天。",
      details: "每天早晨收到专属的能量宣言：",
      examples: [
        "基于你的情绪历史，AI 生成个性化宣言",
        "可生成精美的宣言卡片，设为手机壁纸",
        "帮助你用积极的心态开启新的一天",
        "建立正向的心理暗示和自我认同"
      ]
    },
    { 
      icon: "⚡", 
      title: "高能量测评", 
      desc: "测你在「共振 / 觉醒 / 升维」哪一个阶段。",
      details: "科学评估你的成长阶段：",
      examples: [
        "共振期：开始看见自己的情绪和模式",
        "觉醒期：理解模式背后的原因和需求",
        "升维期：能够主动改变行为和思维方式",
        "根据测评结果，AI 会调整对话策略和建议"
      ]
    },
    { 
      icon: "💰", 
      title: "财富卡点测评", 
      desc: "找到你与金钱关系的卡点。",
      details: "深入探索你的金钱信念和模式：",
      examples: [
        "识别你对金钱的核心信念（匮乏、恐惧、不配得等）",
        "找到影响财富的情绪卡点",
        "理解金钱背后的深层需求",
        "获得调整金钱关系的具体建议"
      ]
    },
    { 
      icon: "💬", 
      title: "AI 生活 Q&A", 
      desc: "情绪、关系、职场、家庭、决策都能问。",
      details: "随时随地的智能生活顾问：",
      examples: [
        "情绪困扰：如何处理焦虑、愤怒、失落",
        "关系问题：亲密关系、职场关系、家庭关系",
        "职场决策：工作选择、职业发展、团队协作",
        "个人成长：目标设定、习惯养成、自我认知"
      ]
    },
    { 
      icon: "🌱", 
      title: "社群共振、绽放故事、训练营", 
      desc: "不再独自改变，一群人一起成长。",
      details: "加入温暖的成长社群：",
      examples: [
        "21天情绪日记训练营：系统化的成长路径",
        "绽放故事：分享你的改变故事，激励他人",
        "社群打卡：与同行者互相支持和见证",
        "小组陪伴：找到志同道合的成长伙伴"
      ]
    }
  ];

  // 训练营阶段
  const campPhases = [
    { phase: "共振期（1–7 天）", goal: "看见自己", color: "bg-gentle/20" },
    { phase: "觉醒期（8–14 天）", goal: "理解模式", color: "bg-warm/20" },
    { phase: "升维期（15–21 天）", goal: "改变行为", color: "bg-accent/20" }
  ];

  // 每日任务
  const dailyTasks = [
    "今日能量宣言",
    "情绪日记",
    "晚间复盘 / 日报",
    "每周周报",
    "社群打卡（可选）"
  ];

  // 快捷指令
  const quickCommands = [
    "开始情绪日记",
    "生成今日能量宣言",
    "生成宣言卡",
    "开始高能量测评",
    "财富测评",
    "生成今日有劲日报",
    "生成本周周报",
    "我需要建议",
    "我想问一个问题"
  ];

  // FAQ数据 - 3大分类，每类10个问题
  interface FAQCategory {
    title: string;
    icon: string;
    description: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  }

  const faqCategories: FAQCategory[] = [
    {
      title: "一、使用与操作类（1–10）",
      icon: "🎯",
      description: "快速上手，轻松使用",
      items: [
        {
          question: "我每天必须写情绪日记吗？",
          answer: "不必须，但越规律越有效。1–3 分钟也可以。",
        },
        {
          question: "我不知道写什么怎么办？",
          answer: "对有劲AI说一句：\"我现在觉得……\" AI 会自动完成完整分析。",
        },
        {
          question: "只有负面情绪才能写吗？",
          answer: "不是。任何感受都可以：开心、平静、疲惫、空虚、兴奋。",
        },
        {
          question: "今天没特别感觉，还需要写吗？",
          answer: "可以写：\"我没有特别感觉\"，AI 仍会帮你梳理状态。",
        },
        {
          question: "一天可以记录多次吗？",
          answer: "可以，多次情绪日记会自动整合成一份日报。",
        },
        {
          question: "记录情绪需要很详细吗？",
          answer: "不需要。一句话就够，AI 会问你适合的问题。",
        },
        {
          question: "忘记写情绪日记可以补吗？",
          answer: "可以。例如：\"帮我补昨天的日报。\"",
        },
        {
          question: "AI 会记得我之前的记录吗？",
          answer: "会记得你的模式与习惯，并持续调整陪伴方式。",
        },
        {
          question: "如果我讲得很乱，AI 能理解吗？",
          answer: "可以。AI 会分段帮助你整理思绪，提取重点。",
        },
        {
          question: "我需要每天都做早晚流程吗？",
          answer: "不强制，按你的节奏来。但坚持越久效果越明显。",
        },
      ],
    },
    {
      title: "二、情绪成长类（11–20）",
      icon: "🌱",
      description: "了解成长路径，见证改变",
      items: [
        {
          question: "情绪日记真的有效吗？",
          answer: "是的。大量研究证明情绪书写可以降低焦虑、提升决策与睡眠。",
        },
        {
          question: "多久能感觉到变化？",
          answer: "通常：3 天心开始稳定，7 天能看到模式，21 天出现明显改变。",
        },
        {
          question: "如果写完反而觉得更糟怎么办？",
          answer: "这代表你正在触碰核心情绪。AI 会陪你找到\"真正需求\"，并给出下一步行动，让情绪开始转化。",
        },
        {
          question: "为什么我总是重复同样的情绪？",
          answer: "因为背后有一个\"未被满足的需求\"或\"未解决的模式\"。有劲AI会帮你找到它。",
        },
        {
          question: "AI 的行动建议我做不到怎么办？",
          answer: "你可以说：\"给我一个更简单的版本\"，AI 会调整成极小可执行步骤。",
        },
        {
          question: "我能只写周报，不写每日吗？",
          answer: "可以，但会少很多洞察。每日记录更能反映真实情绪波动。",
        },
        {
          question: "为什么我写不出洞察？",
          answer: "洞察由 AI 自动生成，你不用硬写。",
        },
        {
          question: "情绪一直不好是不是我有问题？",
          answer: "不是。情绪只是\"系统消息\"，目的是告诉你需要调整什么。",
        },
        {
          question: "情绪日记能改善长期情绪问题吗？",
          answer: "许多人反馈明显改善，但若严重不适，仍建议寻求专业协助。",
        },
        {
          question: "我太敏感适合写情绪日记吗？",
          answer: "很适合。敏感的人能更快看见情绪变化和成长轨迹。",
        },
      ],
    },
    {
      title: "三、产品与系统类（21–30）",
      icon: "⚙️",
      description: "深入了解产品功能",
      items: [
        {
          question: "日报和周报有什么不同？",
          answer: "日报：当天情绪＋洞察＋行动＋故事；周报：你的趋势、关键词云、行动次数、7 天成长轨迹。",
        },
        {
          question: "情绪四部曲是什么？",
          answer: "觉察 → 命名 → 反应 → 转化，是有劲AI使用的核心引导模型。",
        },
        {
          question: "什么是能量宣言？",
          answer: "一句每天的心态指引，帮助你打造稳定能量状态。",
        },
        {
          question: "宣言卡有什么用？",
          answer: "你可以保存、分享、做社群打卡，也可作为每日提醒。",
        },
        {
          question: "高能量测评是什么？",
          answer: "评估你现在处在：共振期、觉醒期、升维期，并指出你当前的能量突破点。",
        },
        {
          question: "财富卡点测评是什么？",
          answer: "帮助你找到\"金钱模式背后的信念卡点\"，并提供具体转化路径。",
        },
        {
          question: "AI 给的建议会不会太制式？",
          answer: "不会。有劲AI的建议来自你的内容、情绪与当天状态，是个性化的。",
        },
        {
          question: "我可以问情绪以外的问题吗？",
          answer: "可以。有劲AI能回答：关系、家庭、职场、压力、决策、困惑等。",
        },
        {
          question: "社群一定要参加吗？",
          answer: "不强制，但社群共振是成长的重要加速器。",
        },
        {
          question: "有劲AI会收集我的隐私吗？",
          answer: "不会。所有对话用于陪伴与成长，遵循严格隐私保护机制。",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 模块1: Hero Banner */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            有劲AI · 情绪日记
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            每天 10 分钟，让情绪变成力量
          </p>
          
          {/* 主视觉图片 */}
          <div className="mt-12 max-w-md mx-auto">
            <img 
              src={heroChatMockup} 
              alt="有劲AI情绪日记对话界面" 
              className="rounded-3xl shadow-2xl w-full hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* CTA按钮 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="hover:scale-105 transition-transform">
              立即体验情绪日记
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToSection('camp')}>
              了解 21 天训练营
            </Button>
          </div>
        </div>
      </section>

      {/* 模块2: 痛点共鸣 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            这些感受，你是不是很熟悉？
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
            不是你变脆弱，是这个时代太吵。你需要一个稳定、温柔又专业的陪伴者。
          </p>
        </div>
      </section>

      {/* 模块3: 什么是有劲AI */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            有劲AI，是你的生活教练
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            有劲AI通过对话、情绪分析、日报周报、测评和社群，<br />
            让你在忙乱生活里，看见情绪、理解自己、找到方向。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="hover:scale-105 transition-transform duration-300 hover:shadow-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 模块4: 为什么从情绪日记开始 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            为什么第一步，是情绪日记？
          </h2>
          
          <Card className="mb-8 hover:shadow-xl transition-shadow">
            <CardHeader>
              <h3 className="text-2xl font-semibold">科学研究告诉我们：</h3>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl mx-auto">
                {/* 数据列表 */}
                <ul className="space-y-4">
                  {scientificData.map((data, index) => {
                    const Icon = data.icon;
                    return (
                      <li key={index} className="flex items-center gap-4">
                        <Icon className="w-6 h-6 text-primary flex-shrink-0" />
                        <Badge variant="secondary" className="text-sm">{data.duration}</Badge>
                        <span className="text-lg font-semibold text-primary">
                          {data.result}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <p className="text-base">
              情绪日记不是多写一点点，<br />
              而是每天完成一次「看见 → 理解 → 行动」的小循环。<br />
              在有劲AI里，你只需要说：
            </p>
            <Card className="bg-muted p-6 border-2 border-primary/20">
              <code className="text-lg font-mono text-foreground">我现在觉得……</code>
            </Card>
            <p className="text-muted-foreground">
              剩下的情绪分析、洞察与行动计划，全由 AI 替你完成。
            </p>
          </div>
        </div>
      </section>

      {/* 模块5: AI如何帮你做情绪日记 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            一句话，AI 帮你完整梳理情绪
          </h2>
          
          <div className="space-y-6">
            {aiSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 模块6: 每日流程 10 分钟 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            每天 10 分钟，让情绪回到平稳
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dailyRoutine.map((routine, index) => {
              const Icon = routine.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                      <span className="font-bold text-lg">{routine.time}</span>
                    </div>
                    <p className="text-muted-foreground">{routine.task}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 模块7: 有劲AI 能做什么 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            有劲AI，不只是聊天
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="hover:scale-105 transition-transform duration-300 hover:shadow-xl cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{feature.desc}</p>
                      <Button variant="ghost" size="sm" className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        查看详情 →
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <span className="text-4xl">{feature.icon}</span>
                      {feature.title}
                    </DialogTitle>
                    <DialogDescription className="text-base mt-4">
                      {feature.details}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      功能特点与使用示例
                    </h4>
                    <ul className="space-y-3">
                      {feature.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <Badge variant="secondary" className="mt-1 flex-shrink-0">
                            {exampleIndex + 1}
                          </Badge>
                          <span className="text-sm">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      💡 立即开始使用，让 AI 成为你的生活教练
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button onClick={handleGetStarted} className="flex-1">
                      立即体验
                    </Button>
                    <Button variant="outline" onClick={() => scrollToSection('camp')} className="flex-1">
                      了解训练营
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* 模块8: 21 天训练营 */}
      <section id="camp" className="container mx-auto px-4 py-16 bg-gradient-to-b from-accent/10 to-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            加入 21 天情绪日记训练营
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            如果你想要一个完整、有陪伴的改变过程，<br />
            21 天训练营会是最适合的方式。
          </p>
          
          {/* 三阶段展示 */}
          <Card className="mb-8 hover:shadow-xl transition-shadow">
            <CardHeader>
              <h3 className="text-2xl font-semibold">三阶段成长路径</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campPhases.map((phase, index) => (
                  <div key={index} className={`p-5 rounded-lg ${phase.color} border-2 border-primary/10`}>
                    <span className="font-bold text-lg">{phase.phase}</span>
                    <span className="text-muted-foreground">：{phase.goal}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 每日任务清单 */}
          <Card className="mb-8 hover:shadow-xl transition-shadow">
            <CardHeader>
              <h3 className="text-2xl font-semibold">每日你会做</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dailyTasks.map((task, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-primary text-xl">✓</span>
                    <span className="text-base">{task}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => {
                if (!user) {
                  navigate('/auth');
                  return;
                }
                navigate('/camp-intro');
              }} 
              className="hover:scale-105 transition-transform"
            >
              立即开始训练营
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleGetStarted}
              className="hover:scale-105 transition-transform gap-2"
            >
              📘 立即体验
            </Button>
          </div>
        </div>
      </section>

      {/* 模块9: 快捷指令 */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            你只需要记住这些话
          </h2>
          
          <Card className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="bg-background p-4 rounded-lg font-mono text-sm space-y-2">
                {quickCommands.map((command, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleCopyCommand(command)}
                    className="hover:bg-accent/10 p-3 rounded cursor-pointer transition-colors border border-transparent hover:border-primary/20 flex items-center justify-between group"
                  >
                    <span>{command}</span>
                    {copiedCommand === command ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                💡 点击任意指令即可复制到剪贴板
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 模块10: FAQ */}
      <section className="container mx-auto px-4 py-16 md:py-20 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              常见问题（FAQ）
            </h2>
            <p className="text-muted-foreground text-lg">
              解答你关心的问题 <Badge variant="secondary" className="ml-2">共 30 条</Badge>
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {faqCategories.map((category, catIndex) => (
              <div key={catIndex} className="space-y-4 md:space-y-6">
                {/* 分类标题区域 */}
                <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 md:p-6 border border-border/50">
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
                    <span className="text-2xl md:text-3xl">{category.icon}</span>
                    <span>{category.title}</span>
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base ml-8 md:ml-12">{category.description}</p>
                </div>

                {/* 该分类的 FAQ 列表 */}
                <Accordion type="single" collapsible className="w-full space-y-2 md:space-y-3">
                  {category.items.map((item, itemIndex) => {
                    const questionNumber = catIndex * 10 + itemIndex + 1;
                    return (
                      <AccordionItem 
                        key={itemIndex} 
                        value={`${catIndex}-${itemIndex}`} 
                        className="border rounded-lg px-3 md:px-4 lg:px-6 bg-card hover:bg-accent/5 hover:border-primary/30 transition-all duration-200"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-3 md:py-4 lg:py-5 group">
                          <div className="flex items-start gap-2 md:gap-3 w-full">
                            <Badge 
                              variant="outline" 
                              className="shrink-0 mt-0.5 min-w-[28px] md:min-w-[32px] h-6 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors"
                            >
                              {questionNumber}
                            </Badge>
                            <span className="font-medium text-sm md:text-base lg:text-lg flex-1 pr-1">{item.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm md:text-base pb-3 md:pb-4 lg:pb-5 pl-8 md:pl-11 lg:pl-14 pr-2 leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                {/* 分类分隔线 */}
                {catIndex < faqCategories.length - 1 && (
                  <Separator className="my-6 md:my-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 模块11: 最终CTA */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-t from-primary/10 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            开始用有劲AI，整理你的情绪
          </h2>
          <p className="text-xl text-muted-foreground">
            只需要一句话，你就能开启改变。
          </p>
          <Button size="lg" onClick={handleGetStarted} className="hover:scale-105 transition-transform">
            立即开始使用
          </Button>
        </div>
      </section>

      {/* 模块12: 页脚 */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">有劲AI · 每个人的生活教练</p>
            <p className="text-xs text-muted-foreground">© 有劲领导力</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Introduction;
