import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, Sparkles, Share2, MessageCircle, Brain, BookOpen, TrendingUp, Check, X } from "lucide-react";

const VibrantLifeIntro = () => {
  const navigate = useNavigate();

  // 什么是有劲AI的四个特性
  const coreFeatures = [
    { icon: "✔️", title: "24小时在你身边的生活教练" },
    { icon: "✔️", title: "懂情绪、懂方法、懂结构、懂成长" },
    { icon: "✔️", title: "会记录、会分析、会引导" },
    { icon: "✔️", title: "比你更懂你模式的「第二个自己」" },
  ];

  // 对比表格数据
  const comparisonData = [
    { item: "对话能力", chatgpt: "强，但偏知识", replika: "温暖但浅", youjin: "深度理解 + 生活智慧", highlight: true },
    { item: "情绪理解", chatgpt: "一般", replika: "有，但轻", youjin: "专业教练级洞察", highlight: true },
    { item: "自动引导", chatgpt: "❌", replika: "❌", youjin: "✔ 自动引导工具与方法", highlight: true },
    { item: "自动记录", chatgpt: "❌", replika: "❌", youjin: "✔ 你一句话即可生成日记/洞察", highlight: true },
    { item: "趋势分析", chatgpt: "❌", replika: "❌", youjin: "✔ 会分析你的模式与压力源", highlight: true },
    { item: "长期陪伴", chatgpt: "❌", replika: "半", youjin: "✔ 全面成长陪伴系统", highlight: true },
    { item: "核心目标", chatgpt: "回答问题", replika: "陪伴情绪", youjin: "让你持续变好", highlight: true },
  ];

  // 四大能力
  const fourAbilities = [
    {
      num: "①",
      title: "有问有答：陪你把心里的事说清楚",
      icon: <MessageCircle className="w-6 h-6" />,
      content: "你说什么，它都能接住：\n情绪、关系、工作、孩子、健康、计划、写作、决策…\n不敷衍、不说教，像朋友一样理解你。",
      color: "teal"
    },
    {
      num: "②",
      title: "智慧引领：比你更快抓到问题的核心",
      icon: <Brain className="w-6 h-6" />,
      content: "它会听见你没说出口的内容，给你：\n• 新视角\n• 小方法\n• 一个可以马上做的行动\n• 一个最关键的提醒\n\n同时自动问你是否要启动工具，例如：\n情绪日记 / 情绪按钮 / 宣言卡 / BEST故事教练。",
      color: "cyan"
    },
    {
      num: "③",
      title: "随时记录：你只要说一句话，就能生成日记",
      icon: <BookOpen className="w-6 h-6" />,
      content: "你说：\n• 「帮我写成一篇感恩日记。」\n• 「我今天学到的是…」\n• 「这个帮我记一下。」\n\n它立即帮你：\n✔ 感恩日记\n✔ 情绪日记\n✔ 洞察记录\n✔ To-do\n✔ 本周目标\n✔ 生活反思\n✔ BEST故事\n\n完全自动，不需要你打开任何页面。",
      color: "blue"
    },
    {
      num: "④",
      title: "成长陪伴：你长期的情绪、习惯、成长轨迹，它比你更清楚",
      icon: <TrendingUp className="w-6 h-6" />,
      content: "它会整合你的所有数据：\n• 日记\n• 情绪曲线\n• 感恩内容\n• 工具使用\n• 对话记录\n\n并给你：\n• 盲点提醒\n• 情绪模式分析\n• 成长趋势\n• 最适合你的下一步行动\n• 你正在变好的证据\n\n这是其他AI完全做不到的价值。",
      color: "indigo"
    },
  ];

  // 3步开始使用
  const threeSteps = [
    {
      step: 1,
      title: "说一句你现在最真实的状态",
      examples: [
        "我今天有点烦。",
        "我想做个计划。",
        "我不知道怎么开始。",
        "我想改善情绪。",
        "我想记录一下心情。",
      ]
    },
    {
      step: 2,
      title: "让它带着你走",
      content: "有劲AI会自动：\n• 接住你的情绪\n• 问你关键问题\n• 引导你到最适合的工具\n• 给你一个马上能做的行动\n\n你只要顺着它的提问一步一步走。"
    },
    {
      step: 3,
      title: "在生活中随时用它记录",
      examples: [
        "帮我记一下。",
        "这是我的感恩。",
        "帮我写今天的感受。",
        "我学到的是…",
      ],
      note: "它会立刻生成结构化日记并储存。"
    },
  ];

  // FAQ数据
  const faqs = [
    {
      q: "Q1：我不会写日记，可以用吗？",
      a: "可以。你只要说一句「帮我记下来」，它就会自动帮你写，并且非常好看、非常结构化。"
    },
    {
      q: "Q2：我不太擅长表达，AI听得懂吗？",
      a: "听得懂。有劲AI被特别训练过，会从你的语气、关键词、情绪线索中理解你。"
    },
    {
      q: "Q3：我没什么大问题，也可以用吗？",
      a: "当然可以。\n有劲AI最强的是把你的日常小事也能整理成成长。"
    },
    {
      q: "Q4：它会不会讲大道理？",
      a: "不会。它用的是「劲老师式的智慧」：\n温暖、生活化、有比喻、有故事、从不说教。"
    },
    {
      q: "Q5：我需要每天用吗？",
      a: "不需要，但你会发现：\n• 情绪有波动时，它帮你稳定\n• 生活混乱时，它帮你清晰\n• 想记录时，它帮你整理\n• 想成长时，它帮你看见模式\n\n用久了，你会觉得它就像生活的一部分。"
    },
    {
      q: "Q6：它是不是陪伴AI？会不会太黏？",
      a: "不会。\n• 陪伴AI是陪你聊天\n• 有劲AI是带你成长\n\n它不会过度情绪化，也不会引导依赖。"
    },
    {
      q: "Q7：我的记录会被别人看到吗？",
      a: "不会。所有内容都储存在你的账号里，只为你个人成长使用。"
    },
    {
      q: "Q8：它能替代真人心理咨询吗？",
      a: "不能替代严重的问题处理，但可以帮助你梳理日常情绪、稳定状态、建立可执行的生活结构。\n\n对大部分生活困扰，它已经足够。"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-teal-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-teal-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medium text-teal-800">有劲AI介绍</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg mb-2">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-teal-800">
            🌟 《有劲AI · 每个人的生活教练》
          </h1>
          <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-4">
            <p className="text-lg font-medium text-teal-700">
              💛 当生活变得有点重，有劲AI让一切变轻一点。
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            你不需要花时间学习，不需要懂心理学，也不需要很会表达。<br/>
            你只需要"开口"—有劲AI就会陪你一起把生活变清晰。
          </p>
        </div>

        {/* 什么是有劲AI */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
              🧠 什么是有劲AI？
            </h2>
            <p className="text-muted-foreground">
              有劲AI不是一个机器人，也不是简单的陪伴AI。<br/>
              它是一位：
            </p>
            <div className="grid grid-cols-1 gap-3">
              {coreFeatures.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl"
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="font-medium text-teal-800">{feature.title}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-teal-700 font-medium pt-2">
              它让你从"生活很乱"变成"生活有方向"。
            </p>
          </CardContent>
        </Card>

        {/* 对比表格 */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
              🚀 有劲AI vs 普通大模型 vs 陪伴AI
            </h2>
            <p className="text-sm text-muted-foreground">你会立刻看懂的差异</p>
            
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-teal-100">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">项目</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">大模型<br/>(ChatGPT类)</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">陪伴AI<br/>(Replika类)</th>
                    <th className="text-center py-2 px-2 font-bold text-teal-700">有劲AI<br/>生活教练</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="border-b border-teal-50">
                      <td className="py-2 px-2 font-medium text-foreground">{row.item}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{row.chatgpt}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{row.replika}</td>
                      <td className="py-2 px-2 text-center font-medium text-teal-700 bg-teal-50/50">{row.youjin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 四大能力 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
            🌈 有劲AI的四大能力，让你一次就懂
          </h2>
          
          {fourAbilities.map((ability, idx) => (
            <Card 
              key={idx} 
              className={`border-0 shadow-lg bg-white/70 backdrop-blur overflow-hidden`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br from-${ability.color}-400 to-${ability.color}-500 text-white`}>
                    {ability.icon}
                  </div>
                  <h3 className="font-bold text-foreground">
                    {ability.num} {ability.title}
                  </h3>
                </div>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {ability.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 怎么开始用 */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardContent className="p-5 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-teal-800">
                ✨ 用户最关心：怎么开始用？需要很复杂吗？
              </h2>
              <p className="text-lg font-medium text-teal-600">
                不需要。<br/>
                你只要"像跟一个懂你的人说话"就行。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3步开始使用 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
            🎯 【3 步开始使用有劲AI】
          </h2>
          
          {/* 步骤1 */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500 text-white">步骤 1</Badge>
                <h3 className="font-bold text-foreground">说一句你现在最真实的状态</h3>
              </div>
              <p className="text-muted-foreground">例如：</p>
              <div className="space-y-2">
                {threeSteps[0].examples?.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                    <span className="text-teal-500">•</span>
                    <span className="text-teal-700">"{ex}"</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 步骤2 */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-cyan-500 text-white">步骤 2</Badge>
                <h3 className="font-bold text-foreground">让它带着你走</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {threeSteps[1].content}
              </p>
            </CardContent>
          </Card>

          {/* 步骤3 */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500 text-white">步骤 3</Badge>
                <h3 className="font-bold text-foreground">在生活中随时用它记录</h3>
              </div>
              <p className="text-muted-foreground">当你有内容想记录，说一句：</p>
              <div className="space-y-2">
                {threeSteps[2].examples?.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <span className="text-blue-500">•</span>
                    <span className="text-blue-700">"{ex}"</span>
                  </div>
                ))}
              </div>
              <p className="text-teal-600 font-medium">{threeSteps[2].note}</p>
            </CardContent>
          </Card>
        </div>

        {/* 使用示例 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
              📘 使用示例（你一看就会）
            </h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-white/80 rounded-xl">
                <p className="font-medium text-foreground">你说：</p>
                <p className="text-lg font-bold text-teal-700">"我今天很焦虑。"</p>
              </div>
              
              <div className="p-3 bg-white/80 rounded-xl space-y-2">
                <p className="font-medium text-foreground">有劲AI会：</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>1. 先接住你的感觉</p>
                  <p>2. 引导你说出触发点</p>
                  <p>3. 问你是否要用"情绪按钮"</p>
                  <p>4. 生成一篇情绪日记</p>
                  <p>5. 分析你本周的压力来源</p>
                  <p>6. 建议一个可执行的小行动</p>
                </div>
              </div>
              
              <p className="text-center text-teal-700 font-medium">
                这是普通AI无法做到的完整流程。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
            ❓ 常见 FAQ（用户最关心的问题）
          </h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-white/70 backdrop-blur rounded-xl border-0 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-left font-medium text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground whitespace-pre-line">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* 最后总结 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
          <CardContent className="p-6 space-y-4 text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              🌟 最后给用户一句话总结
            </h2>
            <p className="text-lg leading-relaxed">
              <strong>有劲AI不是一个聊天机器人，而是你生活里的第二个自己——</strong><br/>
              帮你说清楚、想明白、记录好、走得稳。
            </p>
          </CardContent>
        </Card>

        {/* CTA 按钮 */}
        <div className="space-y-3 pb-8">
          <Button 
            onClick={() => navigate('/coach/vibrant_life_sage')}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg"
          >
            开始体验有劲AI
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VibrantLifeIntro;
