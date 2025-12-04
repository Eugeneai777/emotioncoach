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
import { ArrowLeft, ArrowRight, Brain, Heart, Sparkles, Target, Shield, Phone } from "lucide-react";
import { emotionTypes } from "@/config/emotionReliefConfig";

const EmotionButtonIntro = () => {
  const navigate = useNavigate();

  // 5步稳定流程
  const stabilizationSteps = [
    { icon: "🌬️", title: "呼吸", desc: "稳住身体（降低心跳与紧绷）" },
    { icon: "🎤", title: "自我声音", desc: "用你自己的声音安抚大脑" },
    { icon: "💭", title: "认知提醒", desc: "切断「完了完了」的灾难化思维" },
    { icon: "👆", title: "微行动", desc: "做一个小动作，找回最基本的掌控感" },
    { icon: "🔄", title: "重复练习", desc: "让大脑逐渐建立「我处理得了情绪」的新回路" },
  ];

  // 4阶段设计
  const fourStages = [
    {
      color: "teal",
      label: "🟦 阶段 A",
      title: "生理稳定（Stabilize the Body）",
      subtitle: "先让身体从「全警戒」退回「可对话」。",
      theory: "迷走神经理论 Polyvagal Theory（Stephen Porges）",
      tools: "呼吸、身体锚定、感官觉察",
      goal: "从 100 分强度降到 70 分",
      bgClass: "bg-teal-50 border-teal-200"
    },
    {
      color: "green",
      label: "🟩 阶段 B",
      title: "去灾难化（De-Catastrophizing）",
      subtitle: "从「天要塌了」变成「这是一阵很大的情绪。」",
      theory: "CBT 认知行为疗法（Aaron Beck）",
      tools: "短句认知提醒、区分「事实 vs 想法」",
      goal: "从 70 分降到 50 分",
      bgClass: "bg-green-50 border-green-200"
    },
    {
      color: "yellow",
      label: "🟨 阶段 C",
      title: "找回掌控感（Control & Agency）",
      subtitle: "从「我完全不行」变成「我可以先做一点点。」",
      theory: "Self-Efficacy 自我效能理论（Bandura）",
      tools: "微行动、选择权、当下可控的下一步",
      goal: "从 50 分降到 30 分",
      bgClass: "bg-yellow-50 border-yellow-200"
    },
    {
      color: "red",
      label: "🟥 阶段 D",
      title: "建立长期韧性（Resilience）（进阶）",
      subtitle: "不只「撑过去」，而是「越来越不怕」。",
      theory: "Safety Learning 安全学习（Craske 等）",
      tools: "重复使用情绪按钮、配合情绪教练探索深层模式",
      goal: "降低下一次触发频率与强度",
      bgClass: "bg-red-50 border-red-200"
    },
  ];

  // 使用步骤
  const usageSteps = [
    {
      step: 1,
      title: "按下按钮",
      content: "看着画面或提示，准备进入稳定模式。",
      tip: null
    },
    {
      step: 2,
      title: "跟着做 4–6 呼吸（吸 4 秒，呼 6 秒）",
      content: "吸气时在心里数「1–2–3–4」\n呼气时数「1–2–3–4–5–6」\n重复 4～6 回合",
      tip: "👉 这一步是为了告诉身体：「现在暂时是安全的。」"
    },
    {
      step: 3,
      title: "跟读一句认知提醒",
      content: "例如：\n「我现在很难受，但我其实是安全的。」\n「这是一阵情绪的波，不是全部的我。」",
      tip: "👉 这一步是为了告诉大脑：「刚刚那些最坏画面，不等于现实。」"
    },
    {
      step: 4,
      title: "做一个小动作（找回掌控感）",
      content: "例如：\n握紧拳头 3 秒，再慢慢放松\n描述身边一个物品的颜色与形状\n轻轻拍拍自己的手臂，感受触感",
      tip: "👉 这一步是告诉自己：「我还有选择，我没有完全失控。」"
    },
    {
      step: 5,
      title: "稳住后，进入「情绪教练」继续聊",
      content: "当你感觉强度从 90–100 分降到 50–60 分后，系统会邀请你进入「情绪教练」模式，慢慢把这次情绪讲清楚、看清楚、放下去。",
      tip: null
    },
  ];

  // FAQ 数据
  const faqs = [
    {
      q: "Q1：情绪按钮真的有用吗？不会只是自己骗自己吗？",
      a: `有用。

它整合了：
• 呼吸调节（降低生理激活）
• 认知行为疗法（切断灾难化思维）
• 自我生成效应（说出自己的话）
• 自我效能感（微行动）
• 安全学习（重复形成新回路）

这些方法都在大量研究与临床实践中被证实，可以有效帮助缓解焦虑、恐慌与强情绪。`
    },
    {
      q: "Q2：我需要每天用吗？",
      a: `不用「一定每天」，但：
• 用得越熟练 → 在情绪真正来袭时，就越容易自然而然地启动这套流程
• 很多人会在「压力大的一天结束前」用一次，当成给自己的一种 reset`
    },
    {
      q: "Q3：恐慌很严重的时候，我根本说不出话怎么办？",
      a: `没关系，你可以：
• 先只做呼吸（第 2 步）
• 等身体慢下来一点，再用眼睛看认知提醒
• 然后再试着轻轻地、小声地说出来

有时候，哪怕只是动一动嘴型，都是好的开始。`
    },
    {
      q: "Q4：按完按钮感觉好一点了，还需要情绪教练吗？",
      a: `如果你希望：
• 不只「撑过今天」，
• 还想「下次不要再被同样的事情卡住」，

那就非常建议你继续进入情绪教练。

按钮是急救，
教练才是让你真正从根本上学会「如何跟情绪好好相处」。`
    },
    {
      q: "Q5：适合什么人用？",
      a: `• 经常焦虑、担心很多的人
• 有恐慌、濒临崩溃经验的人
• 情绪一来就很大、很难自己收回去的人
• 父母、学生、职场高压族、高敏感与共情力太强的人
• 正在接受心理咨询或心理治疗的人，也可以将它当成辅助工具`
    },
    {
      q: "Q6：这是心理治疗吗？会不会取代医生或心理师？",
      a: `不是。

情绪按钮与情绪教练：
• 不能取代 心理治疗或药物
• 但可以成为你在日常生活中随时可以用的「情绪稳定工具」

如果你有：
• 严重的抑郁、自杀念头
• 持续性的功能受损（完全无法工作、上学、照顾自己）

请一定优先寻求：
精神科医生、临床心理师、当地心理危机热线的支持。

情绪按钮，是站在他们旁边、陪你一起走路的那只手。`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-sm border-b border-teal-100 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 text-teal-700 hover:bg-teal-100/50"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90"
            >
              开始使用
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-4xl shadow-lg shadow-teal-200">
            🆘
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            情绪按钮 · 官方介绍
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            当情绪太大，一秒按下，让身体稳住、让大脑回来，让你重新可以呼吸。
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/80">
            结合神经科学、临床心理学与呼吸调节的当下情绪急救系统
          </Badge>
        </section>

        {/* 01 什么是情绪按钮 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <h2 className="text-2xl font-bold text-gray-900">01｜什么是「情绪按钮」？</h2>
          </div>
          
          <Card className="bg-white/70 backdrop-blur border-teal-100">
            <CardContent className="p-6 space-y-6">
              <p className="text-gray-700 leading-relaxed">
                情绪按钮是一套基于 <span className="font-semibold text-teal-700">神经科学 + 临床心理学 + 呼吸调节学 + 认知科学</span> 的
                <br />即时情绪急救系统（Emotional First Aid System）。
              </p>
              
              <div className="space-y-4">
                <p className="font-semibold text-gray-800">它专门为这些时刻而设计：</p>
                <div className="flex flex-wrap gap-2">
                  {emotionTypes.map((emotion) => (
                    <Badge 
                      key={emotion.id} 
                      className={`px-3 py-2 text-sm bg-gradient-to-r ${emotion.gradient} text-white border-0`}
                    >
                      {emotion.emoji} {emotion.title} - {emotion.subtitle}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-teal-50/80 rounded-xl p-5 space-y-4">
                <p className="text-gray-700">
                  在这些时刻，你只需要 <span className="font-semibold text-teal-700">按下按钮 30–60 秒</span>，系统会引导你完成一套简单但经过验证的稳定流程：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {stabilizationSteps.map((step, index) => (
                    <div key={index} className="bg-white/80 rounded-lg p-3 text-center space-y-2">
                      <div className="text-2xl">{step.icon}</div>
                      <div className="font-semibold text-gray-800 text-sm">{step.title}</div>
                      <div className="text-xs text-gray-600">{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-cyan-50/80 rounded-xl p-4">
                <p className="text-gray-700">
                  <span className="font-semibold">适用于：</span>焦虑、恐慌、崩溃、烦躁、心乱、压到喘不过气的时刻。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 02 为什么有效 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h2 className="text-2xl font-bold text-gray-900">02｜为什么情绪按钮有效？（科学依据 & 机构支持）</h2>
          </div>

          <p className="text-gray-700 leading-relaxed">
            情绪按钮不是「喊喊口号就好一点」的心理安慰，而是整合了多种经实证支持的方法。
          </p>

          {/* ⭐ 1 呼吸 */}
          <Card className="bg-white/70 backdrop-blur border-l-4 border-l-teal-500 border-teal-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-teal-700 flex items-center gap-2">
                <span>⭐ 1｜呼吸：最快让身体停止「过度警报」</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                大量研究与临床指南都指出：<br />
                <span className="font-semibold">缓慢而有节奏的呼吸，是目前最安全、最易执行的非药物情绪调节方式之一。</span>
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span>缓慢呼吸可以降低交感神经过度激活（负责紧张、心跳加速的系统）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span>增加 HRV（心率变异性），HRV 越高，情绪恢复能力越强</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span>被广泛用于焦虑、恐慌、失眠、自律神经失调等辅助干预</span>
                </li>
              </ul>
              <div className="bg-teal-50/80 rounded-xl p-4">
                <p className="text-gray-700">
                  情绪按钮内置了简单的 <span className="font-semibold text-teal-700">「4–6 呼吸法」</span>：<br />
                  吸气约 4 秒，呼气约 6 秒（呼气比吸气略长），<br />
                  帮助身体从「快要打仗」状态，慢慢回到「相对安全」状态。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ⭐ 2 自己的声音 */}
          <Card className="bg-white/70 backdrop-blur border-l-4 border-l-cyan-500 border-cyan-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-cyan-700 flex items-center gap-2">
                <span>⭐ 2｜听见自己的声音：最熟悉、最安全的「内在讯号」</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                神经科学研究发现：<br />
                人类的大脑对「自己的声音」有非常特别的加工方式——
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-1">•</span>
                  <span>更容易被识别</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-1">•</span>
                  <span>更容易被大脑视为「可信、熟悉、非威胁」</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-1">•</span>
                  <span>更容易与「自我安抚、自我同情」系统连结</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                同时，认知心理学中的 <span className="font-semibold text-cyan-700">「自我生成效应（Self-Generation Effect）」</span> 显示：<br />
                亲口说出的句子，比只是听到或默念的句子，记忆与内化效果可以提高 2–3 倍。
              </p>
              <div className="bg-cyan-50/80 rounded-xl p-4 space-y-3">
                <p className="text-gray-700">
                  所以情绪按钮不会只「播给你听」，<br />
                  而是邀请你亲口说出一两句认知提醒，例如：
                </p>
                <div className="space-y-2">
                  <p className="text-gray-600 italic">「我现在很难受，但我其实是安全的。」</p>
                  <p className="text-gray-600 italic">「这是一阵情绪的波，不是全部的我。」</p>
                </div>
                <p className="text-gray-700">这会让大脑更快相信、也更愿意跟随。</p>
              </div>
            </CardContent>
          </Card>

          {/* ⭐ 3 认知提醒 */}
          <Card className="bg-white/70 backdrop-blur border-l-4 border-l-blue-500 border-blue-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <span>⭐ 3｜认知提醒：切断「天要塌了」的灾难化思维</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-blue-700">认知行为疗法（CBT）</span> 数十年的研究指出：<br />
                焦虑与恐慌的痛苦，很大部分来自「灾难化思维」：
              </p>
              <p className="text-gray-600 italic bg-gray-50/80 rounded-lg p-3">
                「完了、我撑不住了、我会出事、我会崩溃、他们都会离开我……」
              </p>
              <p className="text-gray-700 leading-relaxed">
                使用简短、具体的「认知重新框架句（Cognitive Reframes）」<br />
                可以在短时间内显著减少焦虑评分、恢复理性评估能力。
              </p>
              <div className="bg-blue-50/80 rounded-xl p-4">
                <p className="text-gray-700">
                  情绪按钮中的认知提醒句，<br />
                  就是为了在你「头脑已经被最坏画面塞满」的时候，<br />
                  帮你松动、打断、重组这条恐慌回路。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ⭐ 4 微行动 */}
          <Card className="bg-white/70 backdrop-blur border-l-4 border-l-indigo-500 border-indigo-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                <span>⭐ 4｜微行动：恐慌下降 40–60% 的关键</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                心理学家 Bandura 的 <span className="font-semibold text-indigo-700">自我效能感理论（Self-Efficacy Theory）</span> 指出：<br />
                当人能在混乱中完成一个小动作时，<br />
                无力感会下降，自我掌控感会上升，而恐慌强度会明显降低。
              </p>
              <p className="text-gray-700">因此，情绪按钮的最后一步通常会请你做一个极小、几乎不会失败的动作，例如：</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>握紧手，再慢慢张开</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>说出一句「现在身体最明显的感觉」</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>看向身边一个物品并描述它</span>
                </li>
              </ul>
              <div className="bg-indigo-50/80 rounded-xl p-4">
                <p className="text-gray-700">
                  这些看起来很小，却在大脑里发出一个讯号：<br />
                  <span className="font-semibold">「我不是完全被情绪拖走，我还能做一点点。」</span><br />
                  而这「一点点」，就足以成为你往回走的起点。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ⭐ 5 恐慌恢复机制 */}
          <Card className="bg-white/70 backdrop-blur border-l-4 border-l-purple-500 border-purple-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                <span>⭐ 5｜整个流程符合「恐慌恢复的自然机制」</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                临床与研究经验显示，恐慌与强烈情绪的恢复，大致经历三步：
              </p>
              <div className="space-y-3">
                <div className="bg-purple-50/50 rounded-lg p-3">
                  <p className="font-semibold text-purple-700">1. 降低生理激活：</p>
                  <p className="text-gray-600">先让心跳、呼吸、肌肉紧绷降下来</p>
                </div>
                <div className="bg-purple-50/50 rounded-lg p-3">
                  <p className="font-semibold text-purple-700">2. 重建认知：</p>
                  <p className="text-gray-600">从「我要完了」回到「我正在经历一阵难受」</p>
                </div>
                <div className="bg-purple-50/50 rounded-lg p-3">
                  <p className="font-semibold text-purple-700">3. 恢复掌控感：</p>
                  <p className="text-gray-600">感觉「我可以做点什么」，不再完全被动</p>
                </div>
              </div>
              <p className="text-gray-700 font-semibold">
                情绪按钮的设计，就是按照这条真实、自然的恢复路径来规划的。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 03 为什么设计成4阶段 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            <h2 className="text-2xl font-bold text-gray-900">03｜为什么要设计成 3–4 个阶段？</h2>
          </div>

          <p className="text-gray-700 leading-relaxed">
            从神经系统与心理恢复的角度，<br />
            大脑在情绪极端高张时，几乎都会走过这几个层次：
          </p>

          <div className="space-y-4">
            {fourStages.map((stage, index) => (
              <Card key={index} className={`${stage.bgClass} border-2`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{stage.label}</span>
                    <h3 className="text-lg font-bold text-gray-800">{stage.title}</h3>
                  </div>
                  <p className="text-gray-700">{stage.subtitle}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-gray-500 mb-1">理论来源</p>
                      <p className="text-gray-700">{stage.theory}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-gray-500 mb-1">工具</p>
                      <p className="text-gray-700">{stage.tools}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-gray-500 mb-1">目标</p>
                      <p className="text-gray-700 font-semibold">{stage.goal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-gray-700 font-semibold text-center py-4">
            情绪按钮就是沿着这条「真实的大脑路径」在工作，而不是凭感觉安慰你。
          </p>
        </section>

        {/* 04 为什么要接上情绪教练 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-2xl font-bold text-gray-900">04｜为什么情绪按钮之后，一定要接上「情绪教练」？</h2>
          </div>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-6 space-y-6">
              <p className="text-xl font-bold text-center text-teal-700">
                一句话：<br />
                情绪按钮负责「稳住当下」，情绪教练负责「改变未来」。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-teal-700 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    情绪按钮做的事是：
                  </h4>
                  <p className="text-gray-700">
                    帮你从 95 分的情绪风暴<br />
                    → 降到可以说话、可以听得进一句话的 50–60 分
                  </p>
                  <p className="text-gray-600 italic">
                    让你从「溺水」变成「可以抓到一块木板」
                  </p>
                </div>

                <div className="bg-white/80 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-cyan-700 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    但如果只停在这里——
                  </h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• 情绪背后的需求没有被看见</li>
                    <li>• 触发模式没有被觉察</li>
                    <li>• 人际互动、家庭/工作模式没有改变</li>
                  </ul>
                  <p className="text-gray-600 italic">
                    下一次类似情境出现，你还是可能一样被打趴。
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-blue-700 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  情绪教练做的事是：
                </h4>
                <p className="text-gray-700">
                  在你 <span className="font-semibold">已经稳住、不再处于「爆炸边缘」</span>之后，陪你一起：
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>看见这次情绪是怎么被点燃的</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>找到背后的需求与长期模式</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>区分「事实」与「脑补的最坏剧本」</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>讨论下一次可以用什么新的方式回应</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>一点点重写你与情绪、人际、自我价值的关系</span>
                  </li>
                </ul>
                <p className="text-gray-700">
                  临床上，这被称为 <span className="font-semibold text-blue-700">「情绪转化（Emotional Transformation）」</span>——<br />
                  不只是「压下去」，而是「学会更好的处理方式」。
                </p>
              </div>

              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl p-5 text-center">
                <p className="text-lg font-bold">
                  ✅ 所以：情绪按钮是入口，情绪教练是走完路。
                </p>
                <p className="text-xl font-bold mt-2">
                  按钮救急，教练治根。
                </p>
                <p className="mt-2 text-white/90">
                  两个一起用，才是完整、负责任的情绪照顾系统。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 05 怎么用 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌬️</span>
            <h2 className="text-2xl font-bold text-gray-900">05｜情绪按钮怎么用？（超简单 5 步）</h2>
          </div>

          <div className="space-y-4">
            {usageSteps.map((step, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur border-teal-100">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-lg font-bold text-gray-800">第 {step.step} 步｜{step.title}</h3>
                      <p className="text-gray-700 whitespace-pre-line">{step.content}</p>
                      {step.tip && (
                        <div className="bg-teal-50/80 rounded-lg p-3">
                          <p className="text-teal-700">{step.tip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 06 完整的路 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧩</span>
            <h2 className="text-2xl font-bold text-gray-900">06｜情绪按钮 + 情绪教练 = 一条完整的路</h2>
          </div>

          <Card className="bg-white/70 backdrop-blur border-teal-100">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🆘</div>
                  <h4 className="font-bold text-teal-700">情绪按钮</h4>
                  <p className="text-gray-700">把你从情绪海啸里救上岸。</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl">🧭</div>
                  <h4 className="font-bold text-cyan-700">情绪教练</h4>
                  <p className="text-gray-700">
                    陪你一起研究：<br />
                    为何这片海每次都在同一个地方掀起巨浪？<br />
                    你可以用什么新的方式在这片海上行走？
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 text-center">
                <p className="text-gray-700">
                  科学研究也显示：<br />
                  <span className="font-semibold text-teal-700">情绪强度稍微降下来后，是人类 最容易产生洞察与改变行为模式的时间窗口。</span><br />
                  在这个时间点进入「情绪教练」，效果通常是最好的。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 07 FAQ */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <h2 className="text-2xl font-bold text-gray-900">07｜FAQ：你可能会关心的问题</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-white/70 backdrop-blur rounded-xl border border-teal-100 px-5"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-800 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 whitespace-pre-line pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* 危机资源提示 */}
          <Card className="bg-rose-50/80 border-rose-200">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <p className="font-semibold text-rose-700">如果你正处于危机中：</p>
                  <p className="text-gray-700">
                    如果你有严重的抑郁、自杀念头，或持续性的功能受损，<br />
                    请一定优先寻求专业帮助：精神科医生、临床心理师、当地心理危机热线。
                  </p>
                  <p className="text-gray-600 italic">
                    情绪按钮，是站在他们旁边、陪你一起走路的那只手。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 08 结尾 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏁</span>
            <h2 className="text-2xl font-bold text-gray-900">08｜结尾：给正在被情绪折腾的你</h2>
          </div>

          <Card className="bg-gradient-to-br from-teal-100/80 via-cyan-100/80 to-blue-100/80 border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-5xl">🌿</div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>有情绪，不代表你脆弱，</p>
                <p>很多时候，只是你的神经系统真的太累了。</p>
                <p className="font-semibold text-teal-700">你不需要再一个人硬撑。</p>
                <p>情绪按钮，帮你先稳住当下；</p>
                <p>情绪教练，陪你一起看见与转化。</p>
                <p className="font-semibold text-cyan-700">
                  让情绪不再是一场「风暴」，<br />
                  而是你学会与自己好好相处的起点。
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/energy-studio")}
                  className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90"
                >
                  <Sparkles className="w-5 h-5" />
                  开始使用情绪按钮
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <Heart className="w-5 h-5" />
                  开始情绪梳理
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-teal-100 py-6">
        <div className="container max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          情绪按钮 · 当下情绪急救系统
        </div>
      </footer>
    </div>
  );
};

export default EmotionButtonIntro;
