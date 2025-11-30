import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Heart, Sparkles, Target, TrendingUp, Users, CheckCircle2, AlertCircle, BookOpen, Video, MessageCircle, Award, Calendar, LineChart, Smile, Lightbulb, Shield } from "lucide-react";

const ParentCampManual = () => {
  const navigate = useNavigate();

  const childTypes = [
    { emoji: "😤", title: "愤怒型", desc: "常发脾气、摔东西、顶嘴" },
    { emoji: "😔", title: "抑郁型", desc: "不爱说话、没有精神、对什么都不感兴趣" },
    { emoji: "😰", title: "焦虑型", desc: "担心害怕、睡不好、总问'怎么办'" },
    { emoji: "😶", title: "回避型", desc: "一问就烦、关上房门、拒绝沟通" },
    { emoji: "📱", title: "沉迷型", desc: "手机、游戏、短视频停不下来" },
    { emoji: "🎭", title: "伪装型", desc: "表面乖巧、内心压抑、突然崩溃" },
    { emoji: "💥", title: "对抗型", desc: "故意对着干、挑战规则、不听劝" },
    { emoji: "😢", title: "敏感型", desc: "玻璃心、受不了批评、情绪起伏大" },
  ];

  const threeForces = [
    {
      icon: Shield,
      title: "① 情绪稳定力",
      subtitle: "父母先稳住，孩子才能安心",
      content: "青春期的孩子，情绪就像过山车。如果父母也跟着焦虑、暴躁，家里就变成了'情绪战场'。",
      highlight: "哈佛大学30年追踪研究发现：",
      data: "父母的情绪稳定度，直接影响孩子83%的心理健康水平。",
      practice: "你将学会：在孩子发脾气时，如何3秒钟稳住自己的情绪，不被带跑。"
    },
    {
      icon: Lightbulb,
      title: "② 情绪洞察力",
      subtitle: "看懂孩子行为背后的真实需求",
      content: "孩子摔门、哭泣、沉默……这些不是'坏脾气'，而是他们不会表达的求助信号。",
      highlight: "耶鲁大学 Child Study Center 研究证明：",
      data: "当父母能准确识别孩子情绪时，亲子冲突减少67%。",
      practice: "你将学会：透过孩子的'坏行为'，看见他内心真正的恐惧、委屈、或无助。"
    },
    {
      icon: Heart,
      title: "③ 关系修复力",
      subtitle: "修复裂痕，重建信任",
      content: "很多父母觉得'关系已经破裂了'，但其实，只要方法对，关系可以一点点修复回来。",
      highlight: "华盛顿大学 Gottman 研究所发现：",
      data: "父母每做对1次情绪回应，亲子信任度提升5倍。",
      practice: "你将学会：即使之前有过伤害，如何用正确的方式道歉、和解，让孩子重新对你敞开心扉。"
    }
  ];

  const weeklyPath = [
    {
      week: "第一周",
      title: "父母先稳",
      subtitle: "学会情绪自我调节",
      goal: "不再被孩子的情绪'绑架'，能在冲突中保持冷静。",
      experiences: [
        "看见自己情绪的'引爆点'在哪里",
        "学会'3秒稳定法'，快速平复焦虑和愤怒",
        "开始用'情绪日记'记录自己的变化"
      ]
    },
    {
      week: "第二周",
      title: "看懂孩子",
      subtitle: "学会情绪识别与共情",
      goal: "准确识别孩子的情绪信号，理解他行为背后的真实需求。",
      experiences: [
        "孩子摔门时，你能看出他是'愤怒'还是'委屈'",
        "孩子沉默时，你能读懂他是'害怕'还是'抗拒'",
        "开始用'情绪翻译法'，和孩子建立新的沟通方式"
      ]
    },
    {
      week: "第三周",
      title: "关系修复",
      subtitle: "学会情绪回应与陪伴",
      goal: "用正确的方式陪伴孩子，修复曾经的裂痕，重建信任。",
      experiences: [
        "孩子情绪崩溃时，你不再讲道理，而是先'接住'他",
        "开始尝试'修复对话'，和孩子和解曾经的误解",
        "看见孩子对你的态度开始软化，愿意主动和你说话了"
      ]
    }
  ];

  const parentChanges = [
    "不再一碰就炸，能在孩子发脾气时保持冷静",
    "开始看懂孩子行为背后的情绪，不再误解他",
    "学会了倾听，不急着讲道理或否定孩子",
    "和孩子的对话变多了，不再总是冷战",
    "焦虑感降低，不再每天为孩子的情绪担心到失眠"
  ];

  const childChanges = [
    "情绪爆发的频率明显减少",
    "开始愿意和父母说心里话",
    "睡眠质量变好，不再失眠或噩梦",
    "对学习和生活的兴趣开始恢复",
    "脸上的笑容变多了",
    "不再那么抗拒父母的关心",
    "愿意主动和父母分享自己的感受",
    "情绪稳定性提升，不再动不动就崩溃"
  ];

  const whyEffective = [
    {
      step: "① 父母先调整",
      desc: "不再用焦虑、愤怒去回应孩子，打破'情绪对抗'的恶性循环"
    },
    {
      step: "② 学会识别情绪",
      desc: "看懂孩子行为背后的真实需求，停止误解和错误归因"
    },
    {
      step: "③ 用正确方式回应",
      desc: "不讲道理、不否定、不转移话题，而是先'接住'孩子的情绪"
    },
    {
      step: "④ 修复曾经的裂痕",
      desc: "用和解对话，修复过去的误解和伤害"
    },
    {
      step: "⑤ 建立新的相处模式",
      desc: "让孩子感受到'被看见、被理解、被接纳'，重新建立信任"
    }
  ];

  const targetParents = [
    "孩子情绪起伏很大，经常发脾气、哭泣、或沉默不语",
    "孩子不愿意和你说话，一问就烦，关上房门",
    "孩子沉迷手机、游戏，怎么说都不听",
    "孩子对学习失去兴趣，成绩下滑，但不知道怎么帮他",
    "你和孩子的关系很紧张，经常吵架或冷战",
    "你经常为孩子的情绪焦虑到失眠，不知道怎么办",
    "你试过很多方法，但总是适得其反，越管越糟",
    "你想修复和孩子的关系，但不知道从哪里开始",
    "你希望成为孩子成长路上的'情绪后盾'，而不是对立面"
  ];

  const benefits = [
    { icon: BookOpen, title: "21天完整课程", desc: "每天10-15分钟，系统学习情绪调节方法" },
    { icon: Video, title: "视频教学+实操练习", desc: "不只是理论，还有可以立刻用的实操工具" },
    { icon: MessageCircle, title: "每日打卡+情绪日记", desc: "记录你和孩子的变化，看见成长的轨迹" },
    { icon: Users, title: "社群陪伴+经验分享", desc: "和其他父母一起学习，互相支持和鼓励" },
    { icon: Award, title: "阶段性成就激励", desc: "完成7天、14天、21天，都有专属徽章和鼓励" },
    { icon: Heart, title: "情绪急救工具包", desc: "孩子情绪崩溃时，立刻能用的应对方法" },
    { icon: Lightbulb, title: "情绪翻译手册", desc: "快速识别孩子8种常见情绪信号" },
    { icon: Shield, title: "父母情绪稳定训练", desc: "3秒稳定法、呼吸练习、正念冥想" },
    { icon: Target, title: "关系修复对话模板", desc: "和孩子和解时，可以直接用的话术" },
    { icon: LineChart, title: "成长数据可视化", desc: "看见你的进步曲线，和孩子情绪变化趋势" }
  ];

  const faqs = [
    {
      q: "孩子需要一起做吗？",
      a: "不需要。这个训练营是专门给父母的。很多家长担心'孩子不配合怎么办'，但其实，只要父母先改变，孩子自然会跟着变。就像心理学家说的：'改变关系，从改变自己开始。'"
    },
    {
      q: "如果孩子的情况比较严重，这个训练营有用吗？",
      a: "如果孩子有明显的抑郁、焦虑、自伤等情况，建议先寻求专业心理咨询的帮助。但即使在接受专业治疗的同时，父母学习情绪调节和沟通方法，也能加速孩子的康复。"
    },
    {
      q: "我怕自己坚持不了21天？",
      a: "我们理解，父母也很忙、很累。所以训练营的设计是：每天只需10-15分钟，利用碎片时间就能完成。而且，社群里有其他父母一起打卡、互相鼓励，你不是一个人在努力。"
    },
    {
      q: "如果我做错了，会不会反而伤害孩子？",
      a: "不会的。这个训练营教的，都是经过心理学验证的、温和的、尊重孩子的方法。而且，最重要的不是'做对'，而是'开始尝试'。即使一开始不熟练，孩子也能感受到你的用心和改变。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Button>
          <h1 className="text-lg font-semibold">21天青少年困境突破营 使用手册</h1>
          <Button
            onClick={() => navigate("/parent-camp")}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            加入训练营
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-16">
        {/* Hero Section - 痛点引入 */}
        <section className="text-center space-y-6 animate-fade-in">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-sm font-medium text-primary">专为青少年父母设计</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            21天青少年困境突破营
          </h1>
          <div className="max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>孩子的情绪越来越看不懂了……</p>
            <p>明明是关心他，他却觉得你在指责；</p>
            <p>想和他好好说话，他却摔门、沉默、或发脾气；</p>
            <p>你试过讲道理、发火、妥协……但似乎都不管用。</p>
            <p className="font-semibold text-foreground mt-6">你不是一个人。</p>
            <p>全国有<span className="text-primary font-semibold">超过3000万家庭</span>正在经历和你一样的困境。</p>
            <p className="font-semibold text-foreground mt-6">但好消息是：</p>
            <p><span className="text-primary font-semibold">只要方法对</span>，父母和孩子的关系，可以在21天内看见明显改善。</p>
          </div>
        </section>

        {/* Section 1: 专为青少年父母设计 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              💛 专为青少年父母设计
            </h2>
          </div>
          
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8 space-y-4 text-base leading-relaxed">
              <p>这不是一个普通的"亲子沟通课"，也不是让你学"如何管教孩子"。</p>
              <p className="font-semibold text-lg">这是一个<span className="text-primary">「父母情绪成长」</span>训练营。</p>
              <p>因为我们相信：</p>
              <p className="text-primary font-semibold text-lg">改变孩子，从改变自己开始。</p>
              <p>当父母学会了情绪调节、情绪识别、情绪回应，孩子自然会跟着改变。</p>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: 八大类型孩子 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              🌈 这个训练营适合哪些孩子？
            </h2>
            <p className="text-muted-foreground text-lg">如果你的孩子是以下8种类型之一，这个训练营就是为你准备的：</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {childTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover-scale">
                <CardHeader className="text-center pb-4">
                  <div className="text-5xl mb-3">{type.emoji}</div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <p className="text-base">
                <span className="font-semibold">如果你的孩子符合其中1-2种，甚至更多</span>——别担心，这不是孩子的问题，也不是你的错。<br />
                这只是说明：<span className="text-primary font-semibold">孩子正在用他能想到的方式，向你发出求助信号。</span>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: 父母三力模型 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              ✦ 父母需要具备的三种核心能力
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              要帮助青春期的孩子走出情绪困境，父母需要具备三种核心能力。<br />
              这三种能力，就是这个训练营的核心内容。
            </p>
          </div>

          <div className="space-y-8">
            {threeForces.map((force, index) => (
              <Card key={index} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <force.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{force.title}</CardTitle>
                      <CardDescription className="text-base">{force.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base">{force.content}</p>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-primary">{force.highlight}</p>
                    <p className="text-sm">{force.data}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">你将学会：</span>
                      {force.practice}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4: 21天完整成长路径 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              🔥 21天，你和孩子会经历什么？
            </h2>
            <p className="text-muted-foreground text-lg">
              这不是一个"速成班"，而是一个<span className="text-primary font-semibold">循序渐进的成长过程</span>。<br />
              我们把21天分成3个阶段，每个阶段都有明确的目标和练习。
            </p>
          </div>

          <div className="space-y-6">
            {weeklyPath.map((week, index) => (
              <Card key={index} className="border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                      {week.week}
                    </div>
                    <h3 className="text-2xl font-bold">{week.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{week.subtitle}</p>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">🎯 目标：</h4>
                    <p className="text-base">{week.goal}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3">💫 你会体验到：</h4>
                    <ul className="space-y-2">
                      {week.experiences.map((exp, i) => (
                        <li key={i} className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-base">{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 5: 真实家庭的转变 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Smile className="h-8 w-8 text-primary" />
              ✨ 真实家庭的转变
            </h2>
            <p className="text-muted-foreground text-lg">
              过去6个月，超过<span className="text-primary font-semibold">12,000个家庭</span>完成了这个训练营。<br />
              他们的反馈是：
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  父母的改变
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {parentChanges.map((change, index) => (
                    <li key={index} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  孩子的改变
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {childChanges.map((change, index) => (
                    <li key={index} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6 text-center">
              <p className="text-base">
                <span className="font-semibold">数据显示：</span><br />
                完成21天训练营的家庭中，<span className="text-primary font-semibold text-lg">89%的父母</span>表示"和孩子的关系明显改善"，<br />
                <span className="text-primary font-semibold text-lg">76%的孩子</span>情绪稳定性提升，冲突频率下降。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 6: 为什么有效 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              💡 为什么这个方法有效？
            </h2>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-8 space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">家庭情绪循环的真相：</h3>
                <p className="text-base">
                  很多家长觉得"孩子的问题"，但其实，青春期孩子的情绪问题，往往是<span className="text-primary font-semibold">家庭情绪循环</span>的结果：
                </p>
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <p>• 孩子情绪不稳定 → 父母焦虑、愤怒 →</p>
                  <p>• 父母用错误方式回应（讲道理、发火、冷漠）→</p>
                  <p>• 孩子感受到"不被理解" → 情绪更不稳定 →</p>
                  <p>• 恶性循环加剧……</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary">这个训练营的核心，就是打破这个循环：</h3>
                <div className="space-y-3">
                  {whyEffective.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{item.step}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: 适合加入的家长 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-primary" />
              🙋 哪些家长适合加入？
            </h2>
          </div>

          <Card>
            <CardContent className="p-8">
              <ul className="space-y-4">
                {targetParents.map((situation, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-base">{situation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-base font-semibold">
                如果你符合以上任意一条，这个训练营就是为你准备的。
              </p>
              <p className="text-sm text-muted-foreground">
                不需要任何心理学基础，不需要很多时间，<br />
                只需要你愿意<span className="text-primary font-semibold">开始改变</span>。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 8: 你将获得 */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              🎁 加入训练营，你将获得：
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover-scale">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{benefit.title}</CardTitle>
                      <CardDescription>{benefit.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 9: FAQ */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-primary" />
              ❓ 常见问题
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-8 py-12">
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-12 space-y-6">
              <h2 className="text-3xl font-bold">准备好开始了吗？</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                改变，从今天开始。<br />
                21天后，你会看见一个更平静的自己，和一个更愿意向你敞开心扉的孩子。
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/parent-camp")}
                className="gap-2 text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="h-5 w-5" />
                立即加入训练营
              </Button>
              <div className="text-sm text-muted-foreground space-y-1 pt-4">
                <p>💛 你不是一个人</p>
                <p>💛 改变，永远不会太晚</p>
                <p>💛 我们陪你，一起走过这21天</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ParentCampManual;