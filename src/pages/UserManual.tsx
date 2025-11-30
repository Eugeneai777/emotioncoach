import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  BookOpen, 
  Users, 
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  CheckCircle2,
  MessageCircle,
  BarChart3,
  Lightbulb,
  Star,
  Award
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const UserManual = () => {
  const navigate = useNavigate();

  // 四大整合能力
  const integrations = [
    {
      icon: Heart,
      title: "情绪引导能力",
      description: "温暖陪伴，精准识别你的情绪需求",
      gradient: "from-rose-500 to-pink-500"
    },
    {
      icon: Brain,
      title: "AI 大模型的智慧回答能力",
      description: "随时问，随时得到清晰方向",
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      icon: BarChart3,
      title: "成长可视化报告",
      description: "日报、周报，看见你的进步轨迹",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "社群共振的支持系统",
      description: "真实故事激励，小组深度对话",
      gradient: "from-green-500 to-teal-500"
    }
  ];

  // 核心价值
  const coreValues = [
    {
      emoji: "🤗",
      title: "温暖陪伴与真实关系",
      description: "理解你的痛点",
      gradient: "from-orange-500/10 to-yellow-500/10"
    },
    {
      emoji: "🛠️",
      title: "系统工具与可执行方法",
      description: "给你能做到的行动",
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      emoji: "🌟",
      title: "社群连接与成长支持",
      description: "让改变可持续发生",
      gradient: "from-purple-500/10 to-pink-500/10"
    }
  ];

  // 三大情绪困境
  const emotionChallenges = [
    { emoji: "🌪️", text: "看不见自己的情绪" },
    { emoji: "💭", text: "说不清自己的感受" },
    { emoji: "🔄", text: "转不动自己的状态" }
  ];

  // 五大核心能力
  const coreAbilities = [
    {
      number: "①",
      title: "情绪管理能力（主功能）",
      icon: Heart,
      features: [
        "情绪日记",
        "情绪四部曲（觉察 → 理解 → 反应 → 转化）",
        "情绪复盘",
        "今日洞察",
        "今日行动",
        "今日成长故事"
      ],
      gradient: "from-rose-500 to-pink-500"
    },
    {
      number: "②",
      title: "每日成长能力",
      icon: TrendingUp,
      features: [
        "今日能量宣言",
        "宣言卡",
        "有劲日报",
        "有劲周报"
      ],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      number: "③",
      title: "测评能力",
      icon: Target,
      features: [
        "有劲能量测评（共振/觉醒/升维）"
      ],
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      number: "④",
      title: "AI 生活智慧回答能力",
      icon: Lightbulb,
      features: [
        "情绪与压力",
        "关系沟通",
        "家庭教育",
        "职场困境",
        "决策分析",
        "时间与目标管理",
        "自我怀疑、自卑、焦虑等心理状况",
        "随时问，随时得到清晰方向"
      ],
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      number: "⑤",
      title: "社群共振与教练支持能力",
      icon: Users,
      features: [
        "绽放故事（真实成长见证）",
        "海沃塔深度对话",
        "每周成长直播",
        "小组支持"
      ],
      gradient: "from-green-500 to-teal-500"
    }
  ];

  // 结构地图
  const structureMap = [
    {
      emoji: "🟣",
      title: "主入口：情绪日记",
      items: ["一句话记录心情", "AI 情绪分析", "成长建议", "打卡追踪"],
      color: "purple"
    },
    {
      emoji: "🟢",
      title: "每日成长模块",
      items: ["今日能量宣言", "宣言卡", "有劲日报"],
      color: "green"
    },
    {
      emoji: "🟡",
      title: "进阶成长模块",
      items: ["有劲周报", "能量测评", "财富卡点测评"],
      color: "yellow"
    },
    {
      emoji: "🔵",
      title: "智慧回答模块",
      items: ["\"问有劲 AI\"", "任何生活问题 → 有答案"],
      color: "blue"
    },
    {
      emoji: "🟤",
      title: "社群共振模块",
      items: ["绽放故事", "海沃塔小组", "教练直播"],
      color: "amber"
    }
  ];

  // 每日使用流程
  const dailyFlow: Array<{
    time: string;
    title: string;
    description: string;
    gradient: string;
    features?: string[];
  }> = [
    {
      time: "☀️ 早晨（1分钟）",
      title: "今日能量宣言卡",
      description: "为一天定下心态能量",
      gradient: "from-orange-500/10 to-yellow-500/10"
    },
    {
      time: "🌤 白天（2-3分钟）",
      title: "情绪日记（主功能）",
      description: "一句话告诉有劲 AI 你的感觉",
      features: ["情绪命名", "找触发点", "找需求", "找盲点", "给行动建议"],
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      time: "🌙 晚上（6分钟）",
      title: "情绪复盘 + 今日有劲日报",
      description: "将当天情绪与行为整理成一个完整故事",
      gradient: "from-purple-500/10 to-indigo-500/10"
    },
    {
      time: "📅 每周",
      title: "AI 自动生成有劲周报",
      description: "看见成长趋势与规律",
      gradient: "from-green-500/10 to-teal-500/10"
    }
  ];

  // 训练营内容
  const campIncludes = [
    "今日宣言卡",
    "情绪日记",
    "情绪复盘",
    "日报生成",
    "海沃塔深度对话",
    "每周成长直播",
    "AI 自动周报",
    "21 天情绪成长档案"
  ];

  // 训练营成果
  const campResults = [
    { icon: "✅", text: "情绪更稳定" },
    { icon: "✅", text: "思绪更清晰" },
    { icon: "✅", text: "行动力更强" },
    { icon: "✅", text: "关系更顺畅" },
    { icon: "✅", text: "自我感更强" }
  ];

  // 附加功能
  const additionalFeatures = [
    { icon: Sparkles, title: "今日能量宣言", gradient: "from-orange-500 to-yellow-500" },
    { icon: Star, title: "宣言卡", gradient: "from-pink-500 to-rose-500" },
    { icon: Zap, title: "有劲能量测评", gradient: "from-purple-500 to-indigo-500" },
    { icon: TrendingUp, title: "财富卡点测评", gradient: "from-green-500 to-emerald-500" },
    { icon: Calendar, title: "有劲日报", gradient: "from-blue-500 to-cyan-500" },
    { icon: BarChart3, title: "有劲周报", gradient: "from-teal-500 to-green-500" },
    { icon: MessageCircle, title: "AI 智慧回答系统", gradient: "from-indigo-500 to-purple-500" },
    { icon: Award, title: "绽放故事（社群共振）", gradient: "from-amber-500 to-orange-500" }
  ];

  // FAQ
  const faqs = [
    {
      q: "必须每天写吗？",
      a: "不需要，但越持续越有效。"
    },
    {
      q: "不知道写什么怎么办？",
      a: "只要一句话，有劲 AI 会引导你。"
    },
    {
      q: "我有多个情绪怎么办？",
      a: "一个一个来，有劲 AI 会帮你梳理。"
    },
    {
      q: "晚上太累，不想写？",
      a: "说一句「帮我做日报即可」。"
    },
    {
      q: "有劲 AI 真的懂我吗？",
      a: "越用越懂，这就是 AI 的优势。"
    },
    {
      q: "我不想深度分享可以吗？",
      a: "可以，写一句话也有效。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                有劲 AI · 情绪日记 使用手册
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/camps")}
              className="gap-2"
            >
              开始训练营
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-fade-in">
          <div className="inline-block text-6xl mb-4">💪</div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warm bg-clip-text text-transparent">
            把情绪变力量，让你天天都有劲
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            一位懂你、陪你、帮你成长的生活教练
          </p>
        </section>

        {/* 一、什么是有劲 AI */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">一、什么是有劲 AI？</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              有劲 AI 是一位懂你、陪你、帮你成长的生活教练。<br />
              帮助每个人在情绪、关系、职场、家庭、生活压力中找到方向、找到力量、找到节奏。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((item, index) => (
              <Card key={item.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription className="text-base">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* 使命、愿景、核心价值 */}
        <section className="space-y-8">
          <Card className="overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-8 md:p-12 text-center space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-primary">有劲 AI 的使命</h3>
                <p className="text-2xl md:text-3xl font-bold">
                  让好的行为变得简单，让更好的自己成为必然。
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-primary">有劲 AI 的愿景</h3>
                <p className="text-xl md:text-2xl">
                  让 有劲 AI 成为每个人的生活教练。
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-2xl font-bold mb-6 text-center">有劲 AI 的核心价值</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coreValues.map((value, index) => (
                <Card key={value.title} className={`overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`bg-gradient-to-br ${value.gradient} p-6`}>
                    <div className="text-center space-y-3">
                      <div className="text-4xl">{value.emoji}</div>
                      <h4 className="text-lg font-bold">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 二、为什么从情绪日记开始 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">二、为什么从情绪日记开始？</h3>
            <p className="text-lg text-muted-foreground">
              情绪日记是整个有劲 AI 系统的主入口，原因很简单：
            </p>
          </div>

          {/* 三大情绪困境 */}
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10">
              <CardTitle className="text-2xl text-center">🌪 当代三大情绪困境</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {emotionChallenges.map((challenge, index) => (
                  <div key={index} className="text-center space-y-2 p-4 rounded-lg bg-accent/5">
                    <div className="text-4xl">{challenge.emoji}</div>
                    <p className="font-semibold">{challenge.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 科学研究数据 */}
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <CardTitle className="text-2xl text-center">📊 科学研究证实：记录情绪 = 最快的改善路径</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold bg-accent/5">连续 21 天记录情绪</td>
                      <td className="py-4 px-6 text-primary font-bold">焦虑下降 31%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold bg-accent/5">给情绪命名</td>
                      <td className="py-4 px-6 text-primary font-bold">决策清晰度提升 40%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold bg-accent/5">持续书写</td>
                      <td className="py-4 px-6 text-primary font-bold">睡眠改善 28%</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold bg-accent/5">写下行动</td>
                      <td className="py-4 px-6 text-primary font-bold">行动力提升 2.4 倍</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-muted-foreground mt-6">
                原来不是你的情绪太难，而是你缺少一个稳定、温暖、可持续的系统来引导你。
              </p>
            </CardContent>
          </Card>

          {/* 六个影响源模型 */}
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-center">为什么 有劲 AI 更快、更有效？</CardTitle>
                <p className="text-center text-muted-foreground">
                  基于领导力专家约瑟夫·葛伦尼的「六个影响源模型」：<br />
                  当 6 个影响源同时作用时，改变的力量可以放大 10 倍。
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-4 px-6 font-bold bg-primary/5">影响源</th>
                      <th className="text-left py-4 px-6 font-bold bg-primary/5">有劲 AI 如何作用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold">个人动机</td>
                      <td className="py-4 px-6">让你被理解，被看见</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold">个人能力</td>
                      <td className="py-4 px-6">提供方法、步骤、工具</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold">社会动机</td>
                      <td className="py-4 px-6">社群共振、故事激励</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold">社会能力</td>
                      <td className="py-4 px-6">模仿成功案例</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-6 font-semibold">结构动机</td>
                      <td className="py-4 px-6">日报、周报形成正反馈</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold">结构能力</td>
                      <td className="py-4 px-6">可持续系统，陪你每天练习</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-6 p-4 bg-gradient-to-r from-primary/10 to-warm/10 rounded-lg">
                <p className="text-xl font-bold">
                  有劲 AI = 改变最省力、最温柔、最持久的方式。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 三、五大核心能力 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">三、有劲 AI 能做什么？（五大核心能力）</h3>
          </div>

          <div className="space-y-6">
            {coreAbilities.map((ability, index) => (
              <Card key={ability.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`h-2 bg-gradient-to-r ${ability.gradient}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${ability.gradient} text-white text-2xl font-bold min-w-[48px] text-center`}>
                      {ability.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-4">{ability.title}</CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ability.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden border-2 bg-gradient-to-br from-green-500/5 to-teal-500/5">
            <CardContent className="p-8 text-center">
              <p className="text-xl font-semibold">
                你不是一个人在改变，是一群人一起共振改变。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 四、结构地图 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">四、有劲 AI 的结构地图（导航指南）</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {structureMap.map((module, index) => (
              <Card key={module.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">{module.emoji}</div>
                    <h4 className="font-bold text-lg">{module.title}</h4>
                    {module.items && (
                      <div className="space-y-2 pt-2 border-t">
                        {module.items.map((item) => (
                          <div key={item} className="text-sm text-muted-foreground">
                            • {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 五、每日使用流程 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">五、每日使用流程（10 分钟）</h3>
          </div>

          <div className="space-y-6">
            {dailyFlow.map((flow, index) => (
              <Card key={flow.title} className={`overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`bg-gradient-to-br ${flow.gradient} p-6`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{flow.time.split(' ')[0]}</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold">{flow.time.split(' ').slice(1).join(' ')}</h4>
                      </div>
                    </div>
                    <h5 className="text-xl font-bold">{flow.title}</h5>
                    <p className="text-muted-foreground">{flow.description}</p>
                    {flow.features && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-3">
                        {flow.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 六、21天训练营 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">六、21 天情绪日记训练营（完整成长路径）</h3>
          </div>

          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardTitle className="text-2xl text-center">训练营包含</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {campIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-accent/5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-teal-500/10">
              <CardTitle className="text-2xl text-center">训练营成果</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <span className="text-2xl">{result.icon}</span>
                    <span className="text-lg font-semibold">{result.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 七、附加功能 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">七、有劲 AI 附加功能（亮点功能）</h3>
            <p className="text-lg text-muted-foreground">
              这些附加功能让用户感觉：<br />
              "原来有劲 AI 不是一个功能，而是一个完整的成长系统。"
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={feature.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${feature.gradient} text-white inline-block`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 八、FAQ */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">八、常见问题 FAQ</h3>
          </div>

          <Card className="overflow-hidden border-2">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-8 py-12">
          <Card className="max-w-3xl mx-auto overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5">
            <CardContent className="p-12 space-y-6">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-3xl font-bold">准备好开始你的成长之旅了吗？</h3>
              <p className="text-lg text-muted-foreground">
                从情绪日记开始，让有劲 AI 陪伴你每一天的成长
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/camps")}
                  className="gap-2 bg-gradient-to-r from-primary to-warm hover:opacity-90"
                >
                  开始 21 天训练营
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/energy-studio")}
                >
                  探索有劲生活馆
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default UserManual;