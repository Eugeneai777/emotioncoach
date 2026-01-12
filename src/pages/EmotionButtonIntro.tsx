import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, Brain, Heart, Shield, Phone, Share2, Sparkles, ChevronRight } from "lucide-react";
import { emotionTypes } from "@/config/emotionReliefConfig";
import EmotionButtonShareDialog from "@/components/tools/EmotionButtonShareDialog";

const EmotionButtonIntro = () => {
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // 核心数据徽章
  const coreBadges = [
    { value: "288", label: "专业认知提醒" },
    { value: "9", label: "种情绪场景" },
    { value: "4", label: "阶段科学设计" },
    { value: "30秒", label: "即时稳定" },
  ];

  // 科学依据（精简版）
  const scientificBasis = [
    {
      icon: "🌬️",
      title: "呼吸调节",
      theory: "迷走神经理论",
      summary: "缓慢呼吸降低交感神经激活，提高心率变异性，帮助身体从「全警戒」退回「可对话」状态。",
      color: "teal"
    },
    {
      icon: "🎤",
      title: "自我声音",
      theory: "自我生成效应",
      summary: "亲口说出的句子，记忆与内化效果提高2-3倍。自己的声音被大脑视为「可信、熟悉、非威胁」。",
      color: "cyan"
    },
    {
      icon: "💭",
      title: "认知提醒",
      theory: "认知行为疗法 CBT",
      summary: "简短的认知重构句可以打断「天要塌了」的灾难化思维回路，恢复理性评估能力。",
      color: "blue"
    },
    {
      icon: "👆",
      title: "微行动",
      theory: "自我效能理论",
      summary: "完成一个小动作时，无力感下降、掌控感上升，恐慌强度可降低40-60%。",
      color: "indigo"
    },
    {
      icon: "🔄",
      title: "安全学习",
      theory: "恐慌恢复机制",
      summary: "重复使用建立「我处理得了情绪」的新神经回路，降低下次触发频率与强度。",
      color: "purple"
    },
  ];

  // 4阶段流程（可视化版）
  const fourStages = [
    { emoji: "🟦", label: "觉察", goal: "100→70", desc: "稳住身体", color: "from-teal-400 to-teal-500" },
    { emoji: "🟩", label: "理解", goal: "70→50", desc: "去灾难化", color: "from-green-400 to-green-500" },
    { emoji: "🟨", label: "稳定", goal: "50→30", desc: "找回掌控", color: "from-yellow-400 to-yellow-500" },
    { emoji: "🟥", label: "转化", goal: "30→平静", desc: "建立韧性", color: "from-orange-400 to-red-400" },
  ];

  // FAQ 数据（精简版）
  const faqs = [
    {
      q: "情绪🆘按钮真的有用吗？",
      a: "有用。它整合了呼吸调节、认知行为疗法、自我效能感理论等多种经实证支持的方法，帮助缓解焦虑、恐慌与强情绪。"
    },
    {
      q: "我需要每天用吗？",
      a: "不用每天用。但用得越熟练，在情绪真正来袭时就越容易启动这套流程。很多人会在压力大的一天结束前用一次，当成给自己的 reset。"
    },
    {
      q: "恐慌很严重时说不出话怎么办？",
      a: "先只做呼吸，等身体慢下来一点，再用眼睛看认知提醒，然后再试着轻轻地说出来。哪怕只是动一动嘴型，都是好的开始。"
    },
    {
      q: "按完按钮感觉好一点了，还需要情绪教练吗？",
      a: "如果你希望不只「撑过今天」，还想「下次不要再被同样的事情卡住」，就非常建议继续进入情绪教练。按钮救急，教练治根。"
    },
    {
      q: "这是心理治疗吗？",
      a: "不是。情绪🆘按钮不能取代心理治疗或药物，但可以成为你日常的「情绪稳定工具」。如有严重情况请寻求专业帮助。"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-24">
      <Helmet>
        <title>情绪急救按钮 - 有劲AI</title>
        <meta name="description" content="30秒科学稳定流程，288个认知提醒，9种场景" />
        <meta property="og:title" content="有劲AI • 情绪急救" />
        <meta property="og:description" content="30秒科学稳定流程，288个认知提醒，9种场景" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-emotion-coach.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/emotion-button-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-sm border-b border-teal-100 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1 text-teal-700 hover:bg-teal-100/50"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <Share2 className="w-4 h-4" />
              分享
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-10">
        {/* Hero Section - 优化版 */}
        <section className="text-center space-y-5 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-rose-500 to-red-500 text-3xl shadow-lg shadow-rose-200">
            🆘
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            情绪🆘按钮
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            当情绪太大，一秒按下，让身体稳住、让大脑回来
          </p>
          
          {/* 核心数据徽章 */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {coreBadges.map((badge, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1.5 bg-white/80 text-gray-700 font-medium"
              >
                <span className="text-teal-600 font-bold mr-1">{badge.value}</span>
                {badge.label}
              </Badge>
            ))}
          </div>
        </section>

        {/* 01 什么是情绪SOS按钮 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">💡</span>
            什么是「情绪🆘按钮」？
          </h2>
          
          <Card className="bg-white/70 backdrop-blur border-teal-100">
            <CardContent className="p-5 space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                基于<span className="font-medium text-teal-700">神经科学 + 临床心理学 + 呼吸调节学</span>的即时情绪急救系统
              </p>
              
              {/* 9种情绪徽章 - 移动端优化 */}
              <div className="flex flex-wrap gap-1.5">
                {emotionTypes.map((emotion) => (
                  <Badge 
                    key={emotion.id} 
                    className={`px-2 py-1 text-xs bg-gradient-to-r ${emotion.gradient} text-white border-0`}
                  >
                    {emotion.emoji} {emotion.title}
                  </Badge>
                ))}
              </div>

              <div className="bg-teal-50/80 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  按下按钮 <span className="font-bold text-teal-700">30-60秒</span>，完成科学验证的稳定流程
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 02 4阶段流程可视化 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">🧬</span>
            4阶段科学设计
          </h2>

          {/* 流程图可视化 */}
          <div className="bg-white/70 backdrop-blur rounded-xl p-5 border border-teal-100">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {fourStages.map((stage, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stage.color} flex items-center justify-center text-xl shadow-md`}>
                      {stage.emoji}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="font-bold text-gray-800 text-sm">{stage.label}</p>
                      <p className="text-xs text-gray-500">{stage.desc}</p>
                      <p className="text-xs font-medium text-teal-600 mt-0.5">{stage.goal}</p>
                    </div>
                  </div>
                  {index < fourStages.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4 border-t border-gray-100 pt-3">
              沿着「真实的大脑路径」设计，不是凭感觉安慰你
            </p>
          </div>
        </section>

        {/* 03 科学依据（折叠式） */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">🧠</span>
            为什么有效？
          </h2>

          <Accordion type="single" collapsible className="space-y-2">
            {scientificBasis.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`science-${index}`}
                className="bg-white/70 backdrop-blur rounded-lg border border-teal-100 px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.theory}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  {item.summary}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* 04 按钮 vs 教练 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">🎯</span>
            按钮 vs 教练
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl">🆘</div>
                <h4 className="font-bold text-orange-700 text-sm">情绪按钮</h4>
                <p className="text-xs text-gray-600">稳住当下</p>
                <p className="text-xs text-gray-500">95分 → 50分</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl">🧭</div>
                <h4 className="font-bold text-teal-700 text-sm">情绪教练</h4>
                <p className="text-xs text-gray-600">改变未来</p>
                <p className="text-xs text-gray-500">探索 → 转化</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl p-4 text-center">
            <p className="text-sm font-medium">
              按钮救急，教练治根<br />
              <span className="text-white/80 text-xs">两个一起用，才是完整的情绪照顾系统</span>
            </p>
          </div>
        </section>

        {/* 05 FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-lg">❓</span>
            常见问题
          </h2>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-white/70 backdrop-blur rounded-lg border border-teal-100 px-4"
              >
                <AccordionTrigger className="text-left font-medium text-gray-800 hover:no-underline text-sm py-3">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* 危机资源提示 */}
          <Card className="bg-rose-50/80 border-rose-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-rose-700 text-sm">如果你正处于危机中</p>
                  <p className="text-xs text-gray-600">
                    如有严重的抑郁、自杀念头，请优先寻求专业帮助：精神科医生、心理师、心理危机热线
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 结尾 */}
        <section className="text-center space-y-4 py-4">
          <div className="text-4xl">🌿</div>
          <div className="space-y-2 text-gray-700">
            <p className="text-sm">有情绪，不代表你脆弱</p>
            <p className="font-medium text-teal-700">你不需要再一个人硬撑</p>
          </div>
        </section>
      </main>

      {/* 固定底部CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-teal-100 p-4 z-20">
        <div className="container max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/energy-studio")}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 hover:opacity-90 text-white shadow-lg shadow-rose-200"
          >
            立即体验情绪急救 🆘
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      <EmotionButtonShareDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen} 
      />
    </div>
  );
};

export default EmotionButtonIntro;
