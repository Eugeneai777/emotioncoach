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
import { ArrowLeft, ArrowRight, Sparkles, MessageCircle, Brain, BookOpen, TrendingUp, Check, X, Zap, Heart } from "lucide-react";

const VibrantLifeIntro = () => {
  const navigate = useNavigate();

  // 什么是有劲AI的四个特性
  const coreFeatures = [
    { icon: "🕐", title: "24小时在你身边的生活教练" },
    { icon: "🧠", title: "懂情绪、懂方法、懂结构、懂成长" },
    { icon: "📊", title: "会记录、会分析、会引导" },
    { icon: "🪞", title: "比你更懂你模式的「第二个自己」" },
  ];

  // 对比表格数据
  const comparisonData = [
    { item: "对话能力", chatgpt: "强，但偏知识", replika: "温暖但浅", youjin: "深度理解 + 生活智慧" },
    { item: "情绪理解", chatgpt: "一般", replika: "有，但轻", youjin: "专业教练级洞察" },
    { item: "自动引导", chatgpt: false, replika: false, youjin: "自动引导工具与方法" },
    { item: "自动记录", chatgpt: false, replika: false, youjin: "一句话生成日记/洞察" },
    { item: "趋势分析", chatgpt: false, replika: false, youjin: "分析你的模式与压力源" },
    { item: "长期陪伴", chatgpt: false, replika: "半", youjin: "全面成长陪伴系统" },
    { item: "核心目标", chatgpt: "回答问题", replika: "陪伴情绪", youjin: "让你持续变好" },
  ];

  // 四大能力
  const fourAbilities = [
    {
      num: "01",
      title: "有问有答",
      subtitle: "陪你把心里的事说清楚",
      icon: <MessageCircle className="w-5 h-5" />,
      content: "你说什么，它都能接住：\n情绪、关系、工作、孩子、健康、计划、写作、决策…\n不敷衍、不说教，像朋友一样理解你。",
      gradient: "from-teal-400 to-emerald-400"
    },
    {
      num: "02",
      title: "智慧引领",
      subtitle: "比你更快抓到问题的核心",
      icon: <Brain className="w-5 h-5" />,
      content: "它会听见你没说出口的内容，给你：\n• 新视角\n• 小方法\n• 一个可以马上做的行动\n• 一个最关键的提醒\n\n同时自动问你是否要启动工具，例如：\n情绪日记 / 情绪按钮 / 宣言卡 / BEST故事教练。",
      gradient: "from-cyan-400 to-blue-400"
    },
    {
      num: "03",
      title: "随时记录",
      subtitle: "你只要说一句话，就能生成日记",
      icon: <BookOpen className="w-5 h-5" />,
      content: "你说：\n• 「帮我写成一篇感恩日记。」\n• 「我今天学到的是…」\n• 「这个帮我记一下。」\n\n它立即帮你：\n✔ 感恩日记\n✔ 情绪日记\n✔ 洞察记录\n✔ To-do\n✔ 本周目标\n✔ 生活反思\n✔ BEST故事\n\n完全自动，不需要你打开任何页面。",
      gradient: "from-blue-400 to-indigo-400"
    },
    {
      num: "04",
      title: "成长陪伴",
      subtitle: "你长期的情绪、习惯、成长轨迹，它比你更清楚",
      icon: <TrendingUp className="w-5 h-5" />,
      content: "它会整合你的所有数据：\n• 日记\n• 情绪曲线\n• 感恩内容\n• 工具使用\n• 对话记录\n\n并给你：\n• 盲点提醒\n• 情绪模式分析\n• 成长趋势\n• 最适合你的下一步行动\n• 你正在变好的证据\n\n这是其他AI完全做不到的价值。",
      gradient: "from-indigo-400 to-purple-400"
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
      ],
      color: "teal"
    },
    {
      step: 2,
      title: "让它带着你走",
      content: "有劲AI会自动：\n• 接住你的情绪\n• 问你关键问题\n• 引导你到最适合的工具\n• 给你一个马上能做的行动\n\n你只要顺着它的提问一步一步走。",
      color: "cyan"
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
      note: "它会立刻生成结构化日记并储存。",
      color: "blue"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-cyan-50/50 relative overflow-hidden">
      <Helmet>
        <title>有劲生活教练 - 有劲AI</title>
        <meta name="description" content="24小时在你身边的AI生活教练" />
        <meta property="og:title" content="有劲AI生活教练" />
        <meta property="og:description" content="懂情绪、懂方法、懂结构、懂成长，比你更懂你的第二个自己" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/vibrant-life-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* 装饰性背景元素 */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute top-96 right-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-10 w-64 h-64 bg-blue-200/15 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-teal-100/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-teal-700 hover:bg-teal-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-teal-800">有劲AI介绍</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-10 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-40 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-400 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              有劲AI · 每个人的生活教练
            </h1>
            <p className="text-lg text-teal-600 font-medium">
              当生活变得有点重，有劲AI让一切变轻一点
            </p>
          </div>
          
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5">
              <p className="text-muted-foreground leading-relaxed">
                你不需要花时间学习，不需要懂心理学，也不需要很会表达。
                <br/>
                <span className="font-medium text-teal-700">你只需要"开口"—有劲AI就会陪你一起把生活变清晰。</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 什么是有劲AI */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h2 className="text-xl font-bold text-foreground">什么是有劲AI？</h2>
          </div>
          
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <p className="text-muted-foreground">
                有劲AI不是一个机器人，也不是简单的陪伴AI。它是一位：
              </p>
              <div className="grid gap-2.5">
                {coreFeatures.map((feature, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 rounded-xl border border-teal-100/50"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="font-medium text-foreground">{feature.title}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-center">
                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 px-4 py-1.5">
                  从"生活很乱"变成"生活有方向"
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 对比表格 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="text-xl font-bold text-foreground">有劲AI vs 普通AI</h2>
              <p className="text-sm text-muted-foreground">你会立刻看懂的差异</p>
            </div>
          </div>
          
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">功能</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">
                        ChatGPT类
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">
                        Replika类
                      </th>
                      <th className="text-center py-3 px-2 font-bold text-teal-700 bg-teal-50/50 text-xs">
                        有劲AI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-2.5 px-3 font-medium text-foreground text-xs">{row.item}</td>
                        <td className="py-2.5 px-2 text-center">
                          {row.chatgpt === false ? (
                            <X className="w-4 h-4 text-red-400 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-xs">{row.chatgpt}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {row.replika === false ? (
                            <X className="w-4 h-4 text-red-400 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-xs">{row.replika}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center bg-teal-50/30">
                          <div className="flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                            <span className="text-teal-700 font-medium text-xs">{row.youjin}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 四大能力 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌈</span>
            <h2 className="text-xl font-bold text-foreground">四大能力</h2>
          </div>
          
          <div className="space-y-4">
            {fourAbilities.map((ability, idx) => (
              <Card 
                key={idx} 
                className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  <div className={`h-1.5 bg-gradient-to-r ${ability.gradient}`} />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${ability.gradient} text-white shadow-lg`}>
                        {ability.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-muted-foreground">{ability.num}</span>
                          <h3 className="font-bold text-foreground">{ability.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{ability.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed pl-12">
                      {ability.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 怎么开始用 */}
        <section className="space-y-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white overflow-hidden">
            <CardContent className="p-6 text-center space-y-3">
              <Zap className="w-10 h-10 mx-auto opacity-90" />
              <h2 className="text-xl font-bold">
                怎么开始用？需要很复杂吗？
              </h2>
              <p className="text-lg opacity-95">
                不需要。<br/>
                你只要"像跟一个懂你的人说话"就行。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 3步开始使用 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-foreground">3 步开始使用</h2>
          </div>
          
          <div className="space-y-4">
            {/* 步骤1 */}
            <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-teal-400 to-teal-500" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    1
                  </div>
                  <h3 className="font-bold text-foreground">{threeSteps[0].title}</h3>
                </div>
                <div className="pl-11 space-y-2">
                  <p className="text-sm text-muted-foreground">例如：</p>
                  <div className="flex flex-wrap gap-2">
                    {threeSteps[0].examples?.map((ex, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary"
                        className="bg-teal-50 text-teal-700 border border-teal-100 font-normal"
                      >
                        "{ex}"
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 步骤2 */}
            <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-cyan-400 to-cyan-500" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    2
                  </div>
                  <h3 className="font-bold text-foreground">{threeSteps[1].title}</h3>
                </div>
                <p className="pl-11 text-muted-foreground text-sm whitespace-pre-line">
                  {threeSteps[1].content}
                </p>
              </CardContent>
            </Card>

            {/* 步骤3 */}
            <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    3
                  </div>
                  <h3 className="font-bold text-foreground">{threeSteps[2].title}</h3>
                </div>
                <div className="pl-11 space-y-2">
                  <p className="text-sm text-muted-foreground">当你有内容想记录，说一句：</p>
                  <div className="flex flex-wrap gap-2">
                    {threeSteps[2].examples?.map((ex, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border border-blue-100 font-normal"
                      >
                        "{ex}"
                      </Badge>
                    ))}
                  </div>
                  <p className="text-teal-600 font-medium text-sm">{threeSteps[2].note}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 使用示例 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📘</span>
            <h2 className="text-xl font-bold text-foreground">使用示例</h2>
          </div>
          
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-teal-50/50 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  👤
                </div>
                <div className="flex-1 p-3 bg-white rounded-2xl rounded-tl-sm shadow-sm">
                  <p className="font-medium text-foreground">"我今天很焦虑。"</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl rounded-tl-sm border border-teal-100/50">
                  <p className="font-medium text-teal-700 mb-2">有劲AI会：</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">1</span> 先接住你的感觉</p>
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">2</span> 引导你说出触发点</p>
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">3</span> 问你是否要用"情绪按钮"</p>
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">4</span> 生成一篇情绪日记</p>
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">5</span> 分析你本周的压力来源</p>
                    <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center">6</span> 建议一个可执行的小行动</p>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-sm font-medium text-teal-700 pt-2">
                ✨ 这是普通AI无法做到的完整流程
              </p>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❓</span>
            <h2 className="text-xl font-bold text-foreground">常见问题</h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-white/60 backdrop-blur-sm rounded-xl border-0 shadow-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3.5 hover:no-underline text-left font-medium text-foreground text-sm hover:bg-slate-50/50">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* 最后总结 */}
        <section>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <CardContent className="p-6 space-y-4 text-center relative">
              <Heart className="w-10 h-10 mx-auto opacity-90" />
              <div className="space-y-2">
                <p className="text-lg leading-relaxed">
                  <strong>有劲AI不是一个聊天机器人，</strong>
                  <br/>
                  <strong>而是你生活里的第二个自己——</strong>
                </p>
                <p className="text-xl font-bold">
                  帮你说清楚、想明白、记录好、走得稳。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA 按钮 */}
        <div className="pb-8">
          <Button 
            onClick={() => navigate('/coach/vibrant_life_sage')}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300"
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
