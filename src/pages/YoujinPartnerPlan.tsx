import { ArrowLeft, Check, X, TrendingUp, Users, Zap, Target, Heart, Brain, Sparkles, Crown, Star, Diamond, Share2, AlertTriangle, Copy, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { youjinPartnerLevels } from "@/config/partnerLevels";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const YoujinPartnerPlan = () => {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("链接已复制", { description: "可以粘贴分享给朋友" });
    setShowShareDialog(false);
  };

  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    
    setIsGeneratingPoster(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff8f0',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = '有劲合伙人计划.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("海报已保存", { description: "可以分享给朋友" });
      setShowShareDialog(false);
    } catch (error) {
      toast.error("生成失败", { description: "请稍后再试" });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // 净利润对比数据
  const profitData = [{
    name: '初级合伙人',
    净利润: 2388,
    fill: '#f97316'
  }, {
    name: '高级合伙人',
    净利润: 20895,
    fill: '#ea580c'
  }, {
    name: '钻石合伙人',
    净利润: 66544,
    fill: '#c2410c'
  }];

  // 收益构成数据
  const incomeBreakdownData = [{
    name: '初级',
    体验包收入: 990,
    '365佣金': 2190,
    二级佣金: 0
  }, {
    name: '高级',
    体验包收入: 4950,
    '365佣金': 19162,
    二级佣金: 0
  }, {
    name: '钻石',
    体验包收入: 9900,
    '365佣金': 54750,
    二级佣金: 6844
  }];
  const handleJoin = (levelId: string) => {
    const level = youjinPartnerLevels.find(l => l.level === levelId);
    if (level) {
      navigate('/partner/youjin-intro');
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/partner/youjin-intro')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">有劲合伙人计划</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-12">
        
        {/* Hero Section */}
        <section className="text-center py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-yellow-400/20 -skew-y-3 transform" />
          <div className="relative z-10">
            <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
              🌟 AI 时代最佳副业机会
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
              有劲合伙人 · 让 AI 为你赚钱
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              在 AI 大浪潮中，不被淘汰、反而靠 AI 赚到第一桶金
            </p>
          </div>
        </section>

        {/* Section 01: 时代变了 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧭</span>
            <h2 className="text-2xl font-bold">01｜时代变了：人人都在问——如何抓住 AI 机会？如何不被淘汰？</h2>
          </div>
          
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardContent className="p-6">
              <p className="text-lg mb-4">2025 年最大的焦虑来自同一件事：</p>
              <p className="text-xl font-bold text-slate-800 mb-6">
                AI 的速度正在碾压一切，而大多数人不知道如何利用它。
              </p>
              
              <p className="mb-3">你一定听过这些担忧：</p>
              <ul className="space-y-2 mb-6 text-muted-foreground">
                <li>• "AI 会不会让我的工作消失？"</li>
                <li>• "我又不是技术人，能跟上吗？"</li>
                <li>• "到底怎么让 AI 替我赚钱，而不是替别人赚钱？"</li>
              </ul>
              
              <p className="mb-4">担忧是真实的。但机会也是真实的：</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardContent className="p-6">
              <p className="text-sm text-orange-600 font-medium mb-2">📌 麦肯锡 2024</p>
              <blockquote className="text-lg font-medium text-slate-800">
                "75% 的职业将被 AI 重塑，但只有 12% 的人开始用 AI 创造收入。"
              </blockquote>
            </CardContent>
          </Card>

          <p className="text-lg font-medium text-center py-4">
            换句话说：<span className="text-orange-600">大多数人不是输给 AI，而是输给 "不会用 AI 的自己"。</span>
          </p>

          <p className="text-center mb-4">而这个时代第一次给予普通人一个新机会：</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['不需要技术', '不需要流量', '不需要拍视频', '不需要学习复杂 AI 工具'].map((item, i) => <Card key={i} className="bg-green-50 border-green-200">
                <CardContent className="p-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </CardContent>
              </Card>)}
          </div>

          <p className="text-center text-lg">
            也能让 AI 帮你赚到一份真实的收入。
          </p>
          
          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-medium">
                这正是 <span className="font-bold">有劲合伙人模式</span> 诞生的意义：
              </p>
              <p className="text-xl font-bold mt-2">
                让每一个普通人，都能在 AI 浪潮中拥有自己的位置与收益。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 02: 为什么大多数 AI 副业都难做 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <h2 className="text-2xl font-bold">02｜为什么大多数 AI 副业都难做？（你一定感受过）</h2>
          </div>

          <p className="text-lg">目前所有流行的 AI 赚钱方式，都有一个共同特点：</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['门槛比宣传的高', '竞争激烈', '需要专业技能', '不可复制', '没有持续性收入'].map((item, i) => <Card key={i} className="bg-red-50 border-red-200">
                <CardContent className="p-4 flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </CardContent>
              </Card>)}
          </div>

          <Card className="bg-slate-50">
            <CardContent className="p-6">
              <p className="font-medium mb-3">例如：</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• AI 写作 → 人人会做，价格被打得极低</li>
                <li>• AI 画图 → 工具难学，需求不稳定</li>
                <li>• AI 短视频 → 要剪辑、要素材、要运营</li>
                <li>• AI 做课程 → 要流量、要 IP</li>
                <li>• AI 教别人赚钱 → 信任难建立，竞争激烈</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-400">
            <CardContent className="p-6">
              <p className="text-lg">最终让绝大多数人感觉：</p>
              <blockquote className="text-xl font-bold text-slate-700 mt-2">
                "怎么 AI 到了我这里，一点也不轻松？"
              </blockquote>
              <p className="mt-4 text-orange-600 font-medium">
                因为你一直做的是"你帮 AI 工作"。而不是"AI 帮你赚钱"。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 03: 有劲合伙人完全不同 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌈</span>
            <h2 className="text-2xl font-bold">03｜有劲合伙人完全不同：AI 替你提供价值，你只负责分享成长</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['你不需要变成专家', '你不需要做内容创作', '你不需要卖东西', '你不需要大量时间'].map((item, i) => <Card key={i} className="bg-white/80">
                <CardContent className="p-4 text-center">
                  <span className="text-sm">{item}</span>
                </CardContent>
              </Card>)}
          </div>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-lg">你只有一个任务：</p>
              <p className="text-2xl font-bold mt-2">✔ 分享你自己的真实成长故事。</p>
            </CardContent>
          </Card>

          <p className="text-lg text-center">剩下所有的价值创造，都由 AI 完成：</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['AI 陪伴用户', 'AI 分析情绪', 'AI 生成报告', 'AI 引导用户升级', 'AI 负责长期留存', 'AI 推动训练营转化', 'AI 让用户越来越离不开'].map((item, i) => <Card key={i} className="bg-orange-50 border-orange-200">
                <CardContent className="p-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </CardContent>
              </Card>)}
          </div>

          <p className="text-xl font-bold text-center text-orange-600">
            你做得越真实，AI 帮你赚钱的力量越强。
          </p>
        </section>

        {/* Section 04: 为什么AI情绪教练会成为刚需 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            <h2 className="text-2xl font-bold">04｜为什么"AI 情绪教练"会成为未来十年最刚需的 AI 服务？</h2>
          </div>

          <p className="text-lg">因为情绪问题，不是小众，是全民。</p>
          <p className="text-muted-foreground">国际机构的结论非常一致：</p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <p className="text-sm text-blue-600 font-medium mb-2">📌 世界卫生组织（WHO）2023</p>
                <ul className="space-y-1 text-sm">
                  <li>• 42% 成年人长期处于心理压力</li>
                  <li>• 70% 没获得情绪支持</li>
                  <li>• 情绪是"效率下降第一原因"</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <p className="text-sm text-purple-600 font-medium mb-2">📌 哈佛大学心理健康中心</p>
                <p className="text-sm mb-2">每天 5 分钟情绪记录 →</p>
                <ul className="space-y-1 text-sm">
                  <li>• 焦虑下降 <span className="font-bold">27%</span></li>
                  <li>• 行动力提升 <span className="font-bold">34%</span></li>
                  <li>• 负面循环减少 <span className="font-bold">40%</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <p className="text-sm text-green-600 font-medium mb-2">📌 APA：73% 情绪困扰可用四部曲改善</p>
                <p className="text-sm">
                  Feel → Name → Recognize → Transform<br />
                  <span className="text-muted-foreground">（这正是有劲AI情绪教练的方法论）</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <p className="text-sm text-orange-600 font-medium mb-2">📌 全球科技公司年度报告</p>
                <p className="text-sm">AI 使用最高频的功能不是生产力，而是：</p>
                <p className="font-medium mt-2">情绪陪伴、心理复盘、自我成长。</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-bold text-orange-800">
                AI × 情绪支持 = 最大刚需 × 最高频 × 最大留存 × 最容易产生付费意愿的赛道。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 05: 为什么每个人都需要 AI 情绪教练 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <h2 className="text-2xl font-bold">05｜为什么每个人都需要 AI 情绪教练？</h2>
          </div>

          <p className="text-lg">因为你、我、所有人都在经历：</p>

          <div className="flex flex-wrap gap-2">
            {['情绪波动', '内耗', '不安全感', '关系困扰', '压力过载', '睡眠问题', '想改变又无从下手'].map((item, i) => <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                {item}
              </Badge>)}
          </div>

          <p className="text-lg">AI 情绪教练提供：</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{
            icon: Heart,
            label: '科学四部曲'
          }, {
            icon: Target,
            label: '21 天训练营'
          }, {
            icon: Sparkles,
            label: '宣言卡'
          }, {
            icon: Zap,
            label: '能量测评'
          }, {
            icon: Brain,
            label: '情绪词云'
          }, {
            icon: TrendingUp,
            label: '每日情绪日记'
          }, {
            icon: Users,
            label: '自动成长报告'
          }].map((item, i) => <Card key={i} className="bg-white/80">
                <CardContent className="p-4 flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">{item.label}</span>
                </CardContent>
              </Card>)}
          </div>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardContent className="p-6">
              <p className="text-lg">而且最关键的是：</p>
              <blockquote className="text-xl font-bold text-orange-700 mt-2">
                用户一旦连续使用 50 次，就会感受到明显改善，而无法离开。
              </blockquote>
            </CardContent>
          </Card>

          <p className="text-center text-lg">这正是一个最适合合伙人参与的商业模式：</p>
          
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">高频 → 高留存 → 高复购 → 高收益</p>
            </CardContent>
          </Card>
        </section>

        {/* Section 06: 三层影响力系统 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-bold">06｜AI 替你赚钱的"三层影响力系统"</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">第一层：能力资产化</h3>
                  <p className="text-sm text-muted-foreground">AI = 你的可复制能力</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• 24 小时服务</li>
                  <li>• 海量用户同时陪伴</li>
                  <li>• 自动转化</li>
                  <li>• 自动复盘</li>
                  <li>• 自动提升体验</li>
                </ul>
                <p className="mt-4 text-sm font-medium text-blue-700">
                  你不需要变强，AI 让你"无限放大"。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">第二层：信任入口</h3>
                  <p className="text-sm text-muted-foreground">你的故事 = 用户信任入口</p>
                </div>
                <p className="text-sm mb-3">人们不会被"产品"说服，人们只会被"人"打动。</p>
                <p className="text-sm">你的：</p>
                <ul className="space-y-1 text-sm mt-2">
                  <li>• 变化</li>
                  <li>• 成长</li>
                  <li>• 心路历程</li>
                </ul>
                <p className="mt-4 text-sm font-medium text-purple-700">
                  就是最强的吸引力。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">第三层：收益复利</h3>
                  <p className="text-sm text-muted-foreground">系统自动增长 = 收益可复利</p>
                </div>
                <p className="text-sm mb-3">
                  体验 → 惊艳 → 留存 → 升级 → 裂变。
                </p>
                <p className="mt-4 text-sm font-medium text-green-700">
                  你分享一次，收益可以持续 N 个月甚至 N 年。
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 07: 五层增长飞轮 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔁</span>
            <h2 className="text-2xl font-bold">07｜五层增长飞轮（整个系统的核心）</h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-300 via-amber-400 to-yellow-500" />
            
            <div className="space-y-4">
              {[{
              num: '1️⃣',
              title: '故事吸引',
              desc: '分享你的真实成长故事'
            }, {
              num: '2️⃣',
              title: '9.9 体验产生惊艳',
              desc: '用户低门槛体验 AI 情绪教练'
            }, {
              num: '3️⃣',
              title: 'AI 陪伴形成依赖',
              desc: '持续使用产生习惯与信任'
            }, {
              num: '4️⃣',
              title: '自然升级形成收益',
              desc: '用户主动升级为年度会员'
            }, {
              num: '5️⃣',
              title: '团队裂变形成复利',
              desc: '用户成为新合伙人继续传播'
            }].map((item, i) => <div key={i} className="relative pl-14">
                  <div className="absolute left-3 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <Card className="bg-white/80">
                    <CardContent className="p-4">
                      <p className="font-bold">{item.num} {item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </div>)}
            </div>
          </div>

          <Card className="bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300">
            <CardContent className="p-6 text-center">
              <p className="text-xl font-bold text-orange-800">
                越滚越大、越滚越快。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Section 08: 合伙人等级 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧩</span>
            <h2 className="text-2xl font-bold">08｜合伙人等级</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* L1 */}
            <Card className="bg-gradient-to-br from-orange-400 to-amber-400 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-6 w-6" />
                  <span className="text-2xl font-bold">💪 初级合伙人</span>
                </div>
                <p className="text-4xl font-bold mb-4">¥792</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    100份体验包
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    20%全产品佣金
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    专属二维码
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    合伙人社群
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* L2 */}
            <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-6 w-6" />
                  <span className="text-2xl font-bold">🔥 高级合伙人</span>
                </div>
                <p className="text-4xl font-bold mb-4">¥3217</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    500份体验包
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    35%全产品佣金
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    专属二维码
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    优先活动
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* L3 */}
            <Card className="bg-gradient-to-br from-orange-600 to-amber-600 text-white overflow-hidden relative">
              <div className="absolute top-2 right-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30">推荐</Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Diamond className="h-6 w-6" />
                  <span className="text-2xl font-bold">💎 钻石合伙人</span>
                </div>
                <p className="text-4xl font-bold mb-4">¥4950</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    1000份体验包
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    50%一级佣金
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="font-bold">10%二级佣金</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    VIP邀请
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 09: 收入预测 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📈</span>
            <h2 className="text-2xl font-bold">09｜收入预测（含体验包 + 一级 + 钻石二级）</h2>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                以下所有计算 <span className="font-bold">完全基于最保守假设：30% 用户升级 365</span><br />
                并且 <span className="font-bold">不含训练营、不含续费、不含更多裂变收益</span>。
              </p>
            </CardContent>
          </Card>

          {/* 收入预测免责声明 */}
          <Card className="bg-orange-50 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">⚠️ 收入预测免责声明</p>
                  <p className="text-orange-700 leading-relaxed">
                    以上所有收入数据均为基于保守假设（30%用户升级365）的估算示例，仅供参考。实际收益可能因个人推广能力、市场变化、用户转化率等因素而有所不同。我们不保证任何特定收益水平。参与合伙人计划前，请充分了解相关风险，并根据自身情况做出独立判断。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 净利润对比图表 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 text-center">净利润对比</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{
                    fontSize: 12
                  }} />
                    <YAxis tick={{
                    fontSize: 12
                  }} tickFormatter={value => `¥${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '净利润']} />
                    <Bar dataKey="净利润" radius={[4, 4, 0, 0]}>
                      {profitData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 收益构成图表 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 text-center">收益构成分析</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeBreakdownData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{
                    fontSize: 12
                  }} />
                    <YAxis tick={{
                    fontSize: 12
                  }} tickFormatter={value => `¥${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    
                    <Bar dataKey="体验包收入" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="365佣金" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="二级佣金" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span>体验包收入</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span>365佣金</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded" />
                  <span>二级佣金</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细收入表格 */}
          <div className="space-y-4">
            {/* L1 */}
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-orange-500" />
                  <h3 className="font-bold text-lg">💪 初级合伙人（¥792）</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">100 × 9.9</td>
                        <td className="py-2 text-right font-medium">¥990</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">30 ×（365 × 20%）</td>
                        <td className="py-2 text-right font-medium">¥2,190</td>
                      </tr>
                      <tr className="border-b bg-orange-50">
                        <td className="py-2 font-bold">总收入</td>
                        <td className="py-2 text-right font-bold text-orange-600">¥3,180</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="py-2 font-bold">净利润</td>
                        <td className="py-2 text-right font-bold text-green-600">¥2,388</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* L2 */}
            <Card className="border-orange-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-orange-600" />
                  <h3 className="font-bold text-lg">🔥 高级合伙人（¥3217）</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">500 × 9.9</td>
                        <td className="py-2 text-right font-medium">¥4,950</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">150 ×（365 × 35%）</td>
                        <td className="py-2 text-right font-medium">¥19,162.5</td>
                      </tr>
                      <tr className="border-b bg-orange-50">
                        <td className="py-2 font-bold">总收入</td>
                        <td className="py-2 text-right font-bold text-orange-600">¥24,112.5</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="py-2 font-bold">净利润</td>
                        <td className="py-2 text-right font-bold text-green-600">¥20,895.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* L3 */}
            <Card className="border-orange-400 ring-2 ring-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Diamond className="h-5 w-5 text-orange-700" />
                  <h3 className="font-bold text-lg">💎 钻石合伙人（¥4950，含二级）</h3>
                  <Badge className="bg-orange-100 text-orange-700">推荐</Badge>
                </div>
                
                <p className="text-sm font-medium text-muted-foreground mb-2">一级收入（自己）</p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">1000 × 9.9</td>
                        <td className="py-2 text-right font-medium">¥9,900</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">300 ×（365 × 50%）</td>
                        <td className="py-2 text-right font-medium">¥54,750</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="py-2 font-bold">一级小计</td>
                        <td className="py-2 text-right font-bold text-orange-600">¥64,650</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-sm font-medium text-muted-foreground mb-2">二级收入（示范：5 初级 + 3 高级）</p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">5 初级</td>
                        <td className="py-2 text-right font-medium">¥1,095</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">3 高级</td>
                        <td className="py-2 text-right font-medium">¥5,748.75</td>
                      </tr>
                      <tr className="bg-indigo-50">
                        <td className="py-2 font-bold">二级小计</td>
                        <td className="py-2 text-right font-bold text-indigo-600">¥6,843.75</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm opacity-90">钻石总收入</p>
                        <p className="text-2xl font-bold">¥71,493.75</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-90">净利润</p>
                        <p className="text-2xl font-bold">¥66,543.75</p>
                        <p className="text-xs opacity-75">盈利 1200%+</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 10: 最强总结 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧨</span>
            <h2 className="text-2xl font-bold">10｜一句最强总结：</h2>
          </div>

          <Card className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
              <div className="relative z-10">
                <blockquote className="text-xl md:text-2xl font-bold leading-relaxed">
                  "这个时代不是比谁跑得快，而是比谁更早学会让 AI 替自己工作。
                </blockquote>
                <blockquote className="text-xl md:text-2xl font-bold leading-relaxed mt-4">
                  有劲合伙人，让 AI 替你赚钱，让你在 AI 浪潮中不被淘汰。"
                </blockquote>
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" onClick={() => navigate('/partner/youjin-intro')}>
              了解详情并加入
            </Button>
            <Button variant="outline" className="flex-1 h-14 text-lg border-orange-300 text-orange-600 hover:bg-orange-50" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              分享给朋友
            </Button>
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>分享有劲合伙人计划</DialogTitle>
            <DialogDescription>选择分享方式</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="h-6 w-6 text-orange-500" />
                <span className="text-sm">复制链接</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={handleGeneratePoster}
                disabled={isGeneratingPoster}
              >
                <Download className="h-6 w-6 text-orange-500" />
                <span className="text-sm">{isGeneratingPoster ? '生成中...' : '保存海报'}</span>
              </Button>
            </div>

            {/* Poster Preview - Hidden for export */}
            <div 
              ref={posterRef}
              style={{
                width: '360px',
                padding: '24px',
                backgroundColor: '#fff8f0',
                borderRadius: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Poster Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#ea580c', 
                  backgroundColor: '#fed7aa',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  marginBottom: '12px',
                }}>
                  🌟 AI 时代最佳副业机会
                </div>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #ea580c, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px',
                }}>
                  有劲合伙人 · 让 AI 为你赚钱
                </h2>
                <p style={{ fontSize: '14px', color: '#78716c' }}>
                  在 AI 大浪潮中，靠 AI 赚到第一桶金
                </p>
              </div>

              {/* Key Points */}
              <div style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1c1917' }}>
                  ✔ 不需要技术、不需要流量、不需要拍视频
                </p>
                <p style={{ fontSize: '14px', color: '#57534e', marginBottom: '8px' }}>
                  你只需要：<span style={{ fontWeight: '600', color: '#ea580c' }}>分享真实成长故事</span>
                </p>
                <p style={{ fontSize: '14px', color: '#57534e' }}>
                  AI 替你：陪伴用户、分析情绪、生成报告、推动转化
                </p>
              </div>

              {/* Income Preview */}
              <div style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '12px' }}>
                  收益预测（30%转化率假设）
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#57534e' }}>💪 初级合伙人</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥2,388</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#57534e' }}>🔥 高级合伙人</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥20,895</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#57534e' }}>💎 钻石合伙人</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>净利润 ¥66,543</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.4' }}>
                  ⚠️ 收入预测仅供参考，实际收益因个人能力和市场变化而异，不构成收益承诺。
                </p>
              </div>

              {/* CTA */}
              <div style={{ 
                background: 'linear-gradient(to right, #f97316, #f59e0b)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                  扫码了解详情 或 访问有劲App
                </p>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <p style={{ fontSize: '11px', color: '#a8a29e' }}>
                  有劲 · 让情绪成为力量
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default YoujinPartnerPlan;