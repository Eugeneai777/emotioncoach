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
  Award,
  Mic,
  Phone,
  Shield,
  Palette,
  Compass,
  ClipboardList,
  Video,
  GraduationCap,
  Handshake
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const UserManual = () => {
  const navigate = useNavigate();

  // 有劲生活馆五大模块
  const studioModules = [
    {
      icon: Users,
      emoji: "🎯",
      title: "教练空间",
      description: "AI 智能教练与真人教练，陪你深度梳理情绪与人际关系",
      gradient: "from-rose-500 to-pink-500",
      features: ["情绪教练", "亲子教练", "沟通教练", "故事教练", "有劲生活教练", "真人一对一预约"]
    },
    {
      icon: Palette,
      emoji: "🛠️",
      title: "成长工具",
      description: "三大类工具助力情绪管理、自我探索与生活习惯养成",
      gradient: "from-purple-500 to-indigo-500",
      features: ["情绪按钮（9种情绪即时疗愈）", "能量宣言卡", "呼吸练习", "感恩日记", "习惯追踪"]
    },
    {
      icon: Video,
      emoji: "📚",
      title: "学习课程",
      description: "系统化视频课程，帮你建立情绪管理与人际沟通能力",
      gradient: "from-blue-500 to-cyan-500",
      features: ["情绪管理课程", "亲子沟通课程", "人际关系课程", "自我成长课程"]
    },
    {
      icon: GraduationCap,
      emoji: "🏕️",
      title: "训练营",
      description: "21天系统训练，养成持久的情绪管理习惯",
      gradient: "from-green-500 to-teal-500",
      features: ["21天情绪日记训练营", "21天亲子情绪训练营", "每日打卡", "社区分享"]
    },
    {
      icon: Handshake,
      emoji: "🤝",
      title: "合伙人",
      description: "成为有劲合伙人，传递有劲能量，获得持续收益",
      gradient: "from-amber-500 to-orange-500",
      features: ["推广系统", "学员管理", "佣金收益", "专属物料"]
    }
  ];

  // 教练空间详细介绍
  const coachTypes = [
    {
      emoji: "💪",
      title: "有劲生活教练",
      subtitle: "智能总入口",
      description: "你只需开口，有劲 AI 帮你找到方向。三步交互：共情陪伴 → 即时技巧 → 资源推荐",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      emoji: "🌿",
      title: "情绪教练",
      subtitle: "情绪四部曲",
      description: "觉察 → 理解 → 反应 → 转化，深度梳理每一次情绪体验",
      gradient: "from-rose-500 to-pink-500"
    },
    {
      emoji: "👨‍👩‍👧",
      title: "亲子教练",
      subtitle: "父母先稳，孩子才愿意走向你",
      description: "帮助父母管理自己的情绪，建立更健康的亲子关系",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      emoji: "💬",
      title: "沟通教练",
      subtitle: "轻松说出想说的话",
      description: "让对方愿意听，改善人际表达与关系沟通",
      gradient: "from-purple-500 to-violet-500"
    },
    {
      emoji: "📖",
      title: "故事教练",
      subtitle: "用故事疗愈心灵",
      description: "记录你的成长故事，发现生命中的力量与意义",
      gradient: "from-amber-500 to-yellow-500"
    },
    {
      emoji: "✨",
      title: "感恩教练",
      subtitle: "看见日常微光",
      description: "点亮内心力量，培养感恩的习惯",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  // 情绪按钮系统
  const emotionButtonFeatures = [
    { number: "9", label: "种情绪类型", description: "恐慌、担心、负面、恐惧、烦躁、压力、无力、崩溃、失落" },
    { number: "288", label: "条专业认知提醒", description: "每种情绪32条，全部使用第一人称肯定语气" },
    { number: "4", label: "阶段科学设计", description: "觉察 → 理解 → 稳定 → 转化" },
    { number: "100%", label: "即时可用", description: "无需登录，随时获取情绪支持" }
  ];

  // 成长工具三大分类
  const toolCategories = [
    {
      emoji: "💜",
      title: "情绪工具",
      color: "purple",
      tools: ["情绪按钮（9种情绪即时疗愈）", "能量宣言卡", "呼吸练习", "正念冥想", "频率疗愈"]
    },
    {
      emoji: "💚",
      title: "自我探索",
      color: "green",
      tools: ["价值观探索", "优势发现", "感恩日记", "成长记录"]
    },
    {
      emoji: "🧡",
      title: "生活管理",
      color: "orange",
      tools: ["习惯追踪", "睡眠记录", "运动打卡", "能量日志"]
    }
  ];

  // 更新后的结构地图
  const structureMap = [
    {
      emoji: "🎯",
      title: "教练空间",
      items: ["有劲生活教练（智能入口）", "情绪/亲子/沟通/故事/感恩教练", "真人教练预约"],
      color: "rose"
    },
    {
      emoji: "🛠️",
      title: "成长工具",
      items: ["情绪工具（情绪按钮为核心）", "自我探索工具", "生活管理工具"],
      color: "purple"
    },
    {
      emoji: "📚",
      title: "学习课程",
      items: ["情绪管理课程", "亲子沟通课程", "人际关系课程"],
      color: "blue"
    },
    {
      emoji: "🏕️",
      title: "训练营",
      items: ["21天情绪训练营", "21天亲子训练营", "每日打卡与社区"],
      color: "green"
    },
    {
      emoji: "🤝",
      title: "合伙人",
      items: ["推广系统", "学员管理", "佣金收益"],
      color: "amber"
    }
  ];

  // 更新后的每日使用流程
  const dailyFlow = [
    {
      time: "☀️ 早晨（1分钟）",
      title: "能量宣言卡",
      description: "为一天定下心态能量，开启有力量的一天",
      gradient: "from-orange-500/10 to-yellow-500/10"
    },
    {
      time: "🌤 白天（随时）",
      title: "有劲生活教练 + 情绪按钮",
      description: "遇到情绪困扰时，选择合适的方式获得支持",
      features: ["情绪按钮（即时缓解）", "情绪教练（深度梳理）", "语音对话（随时随地）"],
      gradient: "from-teal-500/10 to-cyan-500/10"
    },
    {
      time: "🌙 晚上（5分钟）",
      title: "感恩日记 + 情绪简报",
      description: "记录今日感恩，回顾情绪成长",
      gradient: "from-purple-500/10 to-indigo-500/10"
    },
    {
      time: "📅 每周",
      title: "成长报告 + 社区分享",
      description: "查看成长趋势，与社区伙伴共振成长",
      gradient: "from-green-500/10 to-teal-500/10"
    }
  ];

  // 语音对话介绍
  const voiceFeatures = [
    { icon: Phone, title: "全局悬浮按钮", description: "任何页面都可一键发起语音对话" },
    { icon: Mic, title: "自然对话", description: "无需打字，直接说出你的困扰" },
    { icon: Brain, title: "智能理解", description: "AI 实时理解并给予温暖回应" }
  ];

  // 真人教练特色
  const humanCoachFeatures = [
    { icon: Award, title: "四级认证体系", description: "新晋 → 认证 → 优选 → 金牌" },
    { icon: Star, title: "多维度评价", description: "专业度、沟通力、帮助性综合评分" },
    { icon: Calendar, title: "灵活预约", description: "选择合适的时间进行一对一咨询" },
    { icon: Shield, title: "安全保障", description: "资质认证、隐私保护、满意保障" }
  ];

  // 附加功能
  const additionalFeatures = [
    { icon: Shield, title: "情绪按钮", description: "9种情绪即时疗愈", gradient: "from-teal-500 to-cyan-500" },
    { icon: Phone, title: "语音对话", description: "随时随地语音交流", gradient: "from-rose-500 to-pink-500" },
    { icon: Users, title: "真人教练", description: "一对一预约咨询", gradient: "from-purple-500 to-indigo-500" },
    { icon: Sparkles, title: "能量宣言卡", description: "开启有力量的一天", gradient: "from-orange-500 to-yellow-500" },
    { icon: Heart, title: "感恩日记", description: "培养感恩习惯", gradient: "from-green-500 to-emerald-500" },
    { icon: Zap, title: "频率疗愈", description: "科学频率冥想", gradient: "from-blue-500 to-cyan-500" },
    { icon: BarChart3, title: "成长报告", description: "可视化成长轨迹", gradient: "from-indigo-500 to-purple-500" },
    { icon: Award, title: "社区分享", description: "与伙伴共振成长", gradient: "from-amber-500 to-orange-500" }
  ];

  // FAQ
  const faqs = [
    {
      q: "情绪按钮和情绪教练有什么区别？",
      a: "情绪按钮是即时的陪伴，适合情绪激动时快速获得认知提醒和稳定；情绪教练是深入的梳理，适合有时间时系统性地处理情绪。两者配合使用效果最佳。"
    },
    {
      q: "如何选择合适的教练？",
      a: "有劲生活教练是智能入口，会根据你的需求自动推荐合适的资源。如果你明确知道自己的需求，也可以直接选择：情绪困扰找情绪教练，亲子问题找亲子教练，人际沟通找沟通教练。"
    },
    {
      q: "语音对话消耗多少点数？",
      a: "语音对话按分钟计费，每分钟消耗8点。首次连接时预扣第一分钟费用，之后每分钟扣费。最长通话10分钟。"
    },
    {
      q: "如何预约真人教练？",
      a: "进入教练空间，点击真人教练，选择合适的教练和时间段，完成支付即可预约。预约成功后会收到微信通知。"
    },
    {
      q: "必须每天使用吗？",
      a: "不需要强制每天使用，但持续使用效果更好。建议至少保持情绪按钮和感恩日记的使用习惯。"
    },
    {
      q: "训练营和自由使用有什么区别？",
      a: "训练营提供系统化的21天成长路径，包含每日打卡、视频学习、社区分享等完整体验。自由使用则可以根据自己的节奏选择性使用各项功能。"
    },
    {
      q: "如何成为有劲合伙人？",
      a: "在有劲生活馆点击「合伙人」进入，选择合适的合伙人等级并完成注册。成为合伙人后可获得专属推广物料和佣金收益。"
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
              onClick={() => navigate("/energy-studio")}
              className="gap-2 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
              返回生活馆
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                有劲 AI · 使用手册
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/energy-studio")}
              className="gap-2"
            >
              开始使用
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
            有劲生活馆 · 完整使用指南
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            把情绪变力量，让你天天都有劲
          </p>
        </section>

        {/* 一、有劲生活馆结构 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">一、有劲生活馆结构</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              有劲生活馆是一个完整的情绪管理与个人成长平台，包含五大核心模块
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioModules.map((module, index) => (
              <Card key={module.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`h-2 bg-gradient-to-r ${module.gradient}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{module.emoji}</div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                      <CardDescription className="text-sm">{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {module.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 二、教练空间 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">二、教练空间</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              AI 智能教练 + 真人教练，为你提供全方位的情绪与成长支持
            </p>
          </div>

          {/* AI 教练 */}
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-center">🤖 AI 智能教练</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coachTypes.map((coach, index) => (
                <Card key={coach.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className={`h-1 bg-gradient-to-r ${coach.gradient}`} />
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{coach.emoji}</span>
                        <div>
                          <h5 className="font-bold">{coach.title}</h5>
                          <p className="text-sm text-muted-foreground">{coach.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{coach.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 真人教练 */}
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardTitle className="text-2xl text-center">👩‍🏫 真人教练一对一</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {humanCoachFeatures.map((feature) => (
                  <div key={feature.title} className="text-center space-y-2 p-4 rounded-lg bg-accent/5">
                    <feature.icon className="w-8 h-8 mx-auto text-primary" />
                    <h5 className="font-semibold">{feature.title}</h5>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 三、情绪按钮系统 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">三、情绪按钮系统（核心功能）</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              当情绪来袭时，情绪按钮是你最快速的支持系统
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emotionButtonFeatures.map((feature) => (
              <Card key={feature.label} className="overflow-hidden border-2 bg-gradient-to-br from-teal-500/5 to-cyan-500/5">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{feature.number}</div>
                  <div className="font-semibold mb-2">{feature.label}</div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
              <CardTitle className="text-xl text-center">🧠 科学依据</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/5">
                  <h5 className="font-semibold mb-2">多迷走神经理论</h5>
                  <p className="text-sm text-muted-foreground">通过呼吸和自我对话激活副交感神经，帮助身体从"战或逃"回到"安全与连接"状态</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5">
                  <h5 className="font-semibold mb-2">认知行为疗法</h5>
                  <p className="text-sm text-muted-foreground">288条认知提醒帮助你识别并转化消极思维模式</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5">
                  <h5 className="font-semibold mb-2">自我效能理论</h5>
                  <p className="text-sm text-muted-foreground">第一人称肯定语气增强自我信念和应对能力</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5">
                  <h5 className="font-semibold mb-2">安全学习理论</h5>
                  <p className="text-sm text-muted-foreground">四阶段设计帮助大脑重新学习"这个情绪是安全的"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 四、成长工具 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">四、成长工具</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              三大类工具，覆盖情绪管理、自我探索和生活习惯
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {toolCategories.map((category, index) => (
              <Card key={category.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{category.emoji}</div>
                  <CardTitle>{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.tools.map((tool) => (
                      <div key={tool} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{tool}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 五、语音对话 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">五、语音对话</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              全局悬浮语音按钮，随时随地与有劲 AI 对话
            </p>
          </div>

          <Card className="overflow-hidden border-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {voiceFeatures.map((feature) => (
                  <div key={feature.title} className="text-center space-y-3 p-4">
                    <div className="inline-block p-4 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h5 className="font-semibold">{feature.title}</h5>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-500/10 rounded-lg text-center">
                <p className="text-sm">
                  💡 语音对话每分钟消耗 8 点，最长通话 10 分钟，需要至少 8 点余额才能开始
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 六、结构地图 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">六、结构地图（导航指南）</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {structureMap.map((module, index) => (
              <Card key={module.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">{module.emoji}</div>
                    <h4 className="font-bold text-lg">{module.title}</h4>
                    <div className="space-y-2 pt-2 border-t">
                      {module.items.map((item) => (
                        <div key={item} className="text-sm text-muted-foreground">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 七、每日使用流程 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">七、每日使用流程</h3>
          </div>

          <div className="space-y-6">
            {dailyFlow.map((flow, index) => (
              <Card key={flow.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
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

        {/* 八、附加功能 */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">八、亮点功能一览</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalFeatures.map((feature, index) => (
              <Card key={feature.title} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-5">
                  <div className="text-center space-y-2">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white inline-block`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 九、FAQ */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">九、常见问题 FAQ</h3>
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
                从有劲生活馆开始，让有劲 AI 陪伴你每一天的成长
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/energy-studio")}
                  className="gap-2 bg-gradient-to-r from-primary to-warm hover:opacity-90"
                >
                  进入有劲生活馆
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/camps")}
                >
                  开始 21 天训练营
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
