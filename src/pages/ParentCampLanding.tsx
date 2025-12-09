import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, Heart, TrendingUp, Users, Zap, BookOpen } from "lucide-react";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { FloatingCTA } from "@/components/camp/FloatingCTA";
import { ScrollToTop } from "@/components/camp/ScrollToTop";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const childTypes = [
  { emoji: '🌧️', label: '抑郁 / 情绪低落', value: 'depression' },
  { emoji: '📚', label: '不愿上学 / 学业拒绝', value: 'school_refusal' },
  { emoji: '📱', label: '网瘾 / 手机沉迷', value: 'addiction' },
  { emoji: '💢', label: '脾气暴躁 / 叛逆冲突', value: 'rebellion' },
  { emoji: '🙈', label: '自卑 / 内向不愿社交', value: 'introvert' },
  { emoji: '📖', label: '学习焦虑 / 完美主义', value: 'anxiety' },
  { emoji: '👥', label: '社交冲突 / 被排挤', value: 'social' },
  { emoji: '🏠', label: '家庭情绪失控（父母容易爆炸）', value: 'family' }
];

export default function ParentCampLanding() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const { user } = useAuth();

  const { data: campTemplate } = useQuery({
    queryKey: ['camp-template', 'parent_emotion_21'],
    queryFn: async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', 'parent_emotion_21')
        .single();
      return data;
    }
  });

  // 查询用户是否已有活跃的训练营
  const { data: existingCamp } = useQuery({
    queryKey: ['existing-parent-camp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .eq('camp_type', 'parent_emotion_21')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  const hasJoinedCamp = !!existingCamp;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-emerald-50/20 to-background">
      {/* 导航栏 */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/camps')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <Button 
            onClick={() => {
              if (hasJoinedCamp && existingCamp) {
                navigate(`/camp/${existingCamp.id}`);
              } else {
                setShowStartDialog(true);
              }
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
          >
            {hasJoinedCamp ? '继续训练' : '立即加入'}
          </Button>
        </div>
      </nav>

      {/* 英雄区 */}
      <section className="relative container mx-auto px-4 py-20 md:py-28 text-center overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto space-y-8 animate-fade-in">
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-lg px-6 py-2 hover:scale-105 transition-transform duration-300">
            👨‍👩‍👧 亲子专题训练营
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            21天青少年困境<br className="md:hidden" />突破营
          </h1>
          
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium animate-fade-in" style={{ animationDelay: '0.2s' }}>
            教你看懂孩子的情绪，让孩子愿意重新靠近你
          </p>

          <div className="bg-card rounded-2xl p-8 border shadow-lg space-y-4 text-left max-w-2xl mx-auto mt-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              "孩子的情绪越来越看不懂了。"
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              "不愿上学、沉迷手机、脾气暴躁、崩溃大哭…"
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              "我越急，他越远；我越说，他越关上心。"
            </p>
            <div className="border-t pt-4 mt-4">
              <p className="text-lg font-medium">如果你也有这样的心声：</p>
              <ul className="space-y-2 mt-3">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>"我不知道怎么帮我的孩子了。"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>"每天都担心，却又每次都忍不住发火。"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>"孩子像被困住了，而我只能看着他下沉。"</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-lg font-semibold text-emerald-800">
                请相信：你不是一个人。
              </p>
              <p className="text-emerald-700 mt-2">
                而这21天，会成为你和孩子关系的转折点。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 这个训练营专为青少年父母而设计 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-background to-amber-50/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              💛 这个训练营专为「青少年父母」而设计
            </h2>
          </div>
          
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-8 space-y-6 text-center">
              <p className="text-xl text-muted-foreground leading-relaxed">
                孩子的问题看似不同，但本质只有一件事：
              </p>
              <p className="text-2xl font-semibold text-foreground leading-relaxed">
                孩子正在情绪风暴里，用行为向你"求助"。
              </p>
              <p className="text-xl text-muted-foreground leading-relaxed">
                我们会教你一种全新的方式：
              </p>
              <p className="text-lg text-muted-foreground">
                不是说教、不是逼迫、不是争吵，而是：
              </p>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                <p className="text-2xl font-bold text-amber-800">
                  ⭐ 「父母先稳，孩子才愿意走向你。」
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 八大孩子类型选择器 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🌈 适用八大类型孩子
            </h2>
            <p className="text-lg text-muted-foreground">
              系统会根据孩子类型自动提供不同的每日指导（你只需选一个）
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {childTypes.map((type, index) => (
              <Card
                key={type.value}
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-2 hover:scale-105",
                  "animate-fade-in",
                  selectedType === type.value && "ring-4 ring-emerald-500 bg-emerald-50 scale-105 shadow-xl"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedType(type.value)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="text-4xl mb-2 transition-transform duration-300 hover:scale-125">{type.emoji}</div>
                  <CardTitle className="text-base leading-snug">{type.label}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="bg-card rounded-xl p-6 border mt-8">
            <p className="text-center text-muted-foreground leading-relaxed">
              无论哪一种，都不是"孩子的问题"。<br />
              而是<span className="font-semibold text-foreground">家庭情绪循环卡住了</span>。<br />
              21天，就是要帮你破开这个循环。
            </p>
          </div>
        </div>
      </section>

      {/* 父母三力模型 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-emerald-50/30 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ✦ 训练营核心方法：父母三力模型
            </h2>
            <p className="text-lg text-muted-foreground">
              完整根据青少年心理学建构
            </p>
          </div>

          <div className="space-y-6">
            {/* 情绪稳定力 */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1">
                <CardHeader className="bg-background">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🌊</div>
                    <div>
                      <CardTitle className="text-2xl">① 情绪稳定力（Stability）</CardTitle>
                      <CardDescription className="text-base mt-1">
                        每天1次「父母稳定练习」
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-background pt-6">
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span>让你不再被孩子的情绪牵动</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span>让孩子重新感到"家是安全的地方"</span>
                    </li>
                  </ul>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="text-3xl font-bold text-amber-600">40-55%</div>
                      <div className="text-sm text-muted-foreground mt-1">情绪爆炸减少</div>
                    </Card>
                    <Card className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="text-3xl font-bold text-amber-600">3-5天</div>
                      <div className="text-sm text-muted-foreground mt-1">孩子感受到变化</div>
                    </Card>
                    <Card className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="text-3xl font-bold text-amber-600">安全感</div>
                      <div className="text-sm text-muted-foreground mt-1">家庭氛围回归</div>
                    </Card>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">🌍 数据来源：</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      <strong>哈佛教育学院</strong>研究指出：父母的反应方式，比孩子的行为本身更能影响孩子的情绪轨迹。当父母越急、越吼、越讲道理，孩子的压力系统就越失控。
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* 情绪洞察力 */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-1">
                <CardHeader className="bg-background">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">👁️</div>
                    <div>
                      <CardTitle className="text-2xl">② 情绪洞察力（Insight）</CardTitle>
                      <CardDescription className="text-base mt-1">
                        每天1次「青少年情绪日记（父母版）」
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-background pt-6">
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>帮你看懂孩子表面行为下的真实需求</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>避免误解、避免错误回应、避免情绪对撞</span>
                    </li>
                  </ul>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">25-38%</div>
                      <div className="text-sm text-muted-foreground mt-1">情绪反应强度下降</div>
                    </Card>
                    <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">误解减少</div>
                      <div className="text-sm text-muted-foreground mt-1">错误回应避免</div>
                    </Card>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">🌍 数据来源：</p>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <strong>哈佛Dana Center</strong>研究发现：当父母能正确辨识孩子情绪，孩子的情绪反应强度可下降25-38%。也就是说：父母"看懂孩子"，孩子就能慢慢稳定下来。
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* 关系修复力 */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-1">
                <CardHeader className="bg-background">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💚</div>
                    <div>
                      <CardTitle className="text-2xl">③ 关系修复力（Connection）</CardTitle>
                      <CardDescription className="text-base mt-1">
                        每天1个「可执行的亲子连接行动」
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-background pt-6">
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>不讲道理、不对抗</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>用"关系"取代"冲突"</span>
                    </li>
                  </ul>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="text-3xl font-bold text-emerald-600">53%</div>
                      <div className="text-sm text-muted-foreground mt-1">合作意愿提高</div>
                    </Card>
                    <Card className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="text-3xl font-bold text-emerald-600">21天</div>
                      <div className="text-sm text-muted-foreground mt-1">关系温度回升</div>
                    </Card>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-900 mb-2">🌍 数据来源：</p>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      <strong>Gottman Institute</strong>研究：持续21天进行修复性互动，青少年的合作意愿提高53%。当关系变暖，孩子自然愿意靠近。
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 21天成长路径 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 21天完整成长路径
            </h2>
            <p className="text-lg text-muted-foreground">
              科学可验证的改变过程
            </p>
          </div>

          <div className="space-y-6">
            {/* 第一周 */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    第1周
                  </Badge>
                  <CardTitle className="text-2xl">🌱 父母先稳</CardTitle>
                </div>
                <CardDescription className="text-base">
                  目标：让你恢复情绪控制，不再爆炸
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-3">你会体验到：</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>焦虑和无力感下降</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>不再"被孩子牵着走"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>冲突减少</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">孩子开始感觉到你变了（这是关键）</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 第二周 */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    第2周
                  </Badge>
                  <CardTitle className="text-2xl">👁️ 看懂孩子</CardTitle>
                </div>
                <CardDescription className="text-base">
                  目标：看懂孩子行为背后的情绪信号
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-3">你会看懂：</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>拒学背后是<strong>害怕</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>网瘾背后是<strong>逃避压力</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>叛逆背后是想<strong>保持尊严</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>内向背后是<strong>害怕被否定</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>沉默背后是<strong>"我撑不住了"</strong></span>
                  </li>
                </ul>
                <div className="bg-blue-50 rounded-lg p-3 mt-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    看懂之后，你的反应自然会更温柔、更有效。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 第三周 */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    第3周
                  </Badge>
                  <CardTitle className="text-2xl">💚 关系修复</CardTitle>
                </div>
                <CardDescription className="text-base">
                  目标：让孩子慢慢靠近你
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-3">你会看见：</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>孩子愿意说一句</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>愿意做一点</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>愿意多待5分钟</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>愿意让你进入他的世界</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>家里气氛从"紧绷"变成"松动"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>你们关系开始有温度</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">孩子开始恢复力量</span>
                  </li>
                </ul>
                <div className="bg-emerald-50 rounded-lg p-3 mt-4 border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium">
                    这才是改变青少年情绪的真正起点。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 真实转变数据 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-background to-emerald-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              真实家庭的转变
            </h2>
            <p className="text-lg text-muted-foreground">
              根据家庭干预研究（APA, 2022；Gottman 数据）
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 父母的改变 */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-600" />
                  父母的改变
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">情绪爆炸减少 40-55%</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">焦虑下降 20-35%</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>"讲道理"次数减少</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>更稳定、更柔软</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>更能看到孩子的真实需要</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 孩子的改变 */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-emerald-600" />
                  孩子的改变
                </CardTitle>
                <CardDescription>（0.1cm靠近的趋势）</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>崩溃次数减少</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>不再一提学校就发作</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>愿意回应一句</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>愿意放下手机几分钟</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>冲突减少</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>情绪暴走减少</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>愿意一起做一件小事</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">家里不再"像战场一样"</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-xl font-semibold text-emerald-700">
              不是奇迹，而是趋势。
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              这种趋势，就是改变孩子的起点。
            </p>
          </div>
        </div>
      </section>

      {/* 为什么有效 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-emerald-50/30 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">
                为什么有效？
              </CardTitle>
              <CardDescription className="text-base">
                不是心理课程，而是一套系统
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-3">
                <p className="text-lg">
                  <span className="text-red-500 font-semibold">❌</span> 孩子的问题，不是"他不听话"
                </p>
                <p className="text-lg">
                  <span className="text-red-500 font-semibold">❌</span> 父母的问题，也不是"你不够好"
                </p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                <p className="text-xl font-bold text-emerald-800 text-center mb-4">
                  真正的问题是：
                </p>
                <p className="text-2xl font-bold text-center text-emerald-900">
                  家庭情绪循环卡住了。
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-lg">而我们正在做的是：</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>帮父母稳定自己</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>帮孩子看到改变</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>帮关系恢复安全感</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>帮家庭重建连接</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>帮孩子找回力量</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <p className="text-center font-medium">
                  这是一套<span className="text-emerald-600"> 完全科学、可执行、可坚持 </span>的家庭系统重建方法。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 适合加入的家长 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">
                适合加入的家长
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">如果你正经历：</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>孩子情绪波动大</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>不愿上学</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>情绪低落、封闭、不沟通</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>沉迷手机</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>容易崩溃或爆炸</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>社交困难</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>早晨像战争</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>家里冲突不断</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span>父母常焦虑、无力、愧疚</span>
                </li>
              </ul>
              <div className="bg-emerald-100 rounded-xl p-6 text-center">
                <p className="text-xl font-semibold text-emerald-800">你不是孤单的，</p>
                <p className="text-xl font-bold text-emerald-900 mt-2">这个训练营就是为你而做。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 你将获得 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-background to-emerald-50/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              你将获得：
            </h2>
          </div>
          
          <Card>
            <CardContent className="pt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">21天 × AI陪伴</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">每天一次情绪梳理（四部曲＋微行动）</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">每天一次父母稳定练习</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">每天一次关系修复行动</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">四大智能AI教练</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">针对孩子八大类型的专属路径</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg font-semibold text-emerald-600">每天仅需10分钟</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">一套可复制的亲子沟通脚本</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">•</span>
                <span className="text-lg">一套可持续使用的家庭情绪系统</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-emerald-50/30 to-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ❓ 常见问题（父母最关心的）
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                孩子需要一起做吗？
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                不需要。训练营是给父母的。你稳下来，孩子自然会靠近。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                严重情况怎么办？
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                训练营不是治疗，但能改善家庭情绪系统。AI会在必要时建议你寻求线下资源。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                我怕坚持不了？
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                每天10分钟，一句事件就能开始。这是最轻量、最不压迫的训练营。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                如果我做错，会不会伤害孩子？
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                不会。所有内容都经过"零风险、稳态、安全、可执行"验证。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
            <CardContent className="relative z-10 py-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                🔥 改变不会来自吼孩子，
              </h2>
              <p className="text-2xl font-semibold">
                而是来自你愿意迈出的第一步。
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => {
                    if (hasJoinedCamp && existingCamp) {
                      navigate(`/camp/${existingCamp.id}`);
                    } else {
                      setShowStartDialog(true);
                    }
                  }}
                  className="bg-white text-emerald-600 hover:bg-white/90 text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:scale-105 transition-transform duration-300"
                >
                  {hasJoinedCamp ? '继续训练营' : '立即加入《21天青少年困境突破营》'}
                </Button>
              </div>
              <div className="pt-4 space-y-2 text-white/90">
                <p className="text-lg">让孩子愿意重新走向你，</p>
                <p className="text-lg">让家庭情绪重新稳定，</p>
                <p className="text-lg">让你们的关系回到温暖。</p>
              </div>
            </CardContent>
          </Card>

          {/* 链接到详细使用手册 */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/parent-camp-manual')}
              className="gap-2 text-lg px-6 py-6 h-auto hover:scale-105 transition-transform duration-300"
            >
              <BookOpen className="w-5 h-5" />
              查看完整使用手册
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              了解更多训练营的详细设计理念和科学依据
            </p>
          </div>
        </div>
      </section>

      {/* 浮动组件 */}
      <FloatingCTA 
        onClick={() => {
          if (hasJoinedCamp && existingCamp) {
            navigate(`/camp/${existingCamp.id}`);
          } else {
            setShowStartDialog(true);
          }
        }}
        text={hasJoinedCamp ? '继续训练' : '立即加入训练营'}
      />
      <ScrollToTop />

      {/* 开始训练营对话框 */}
      {campTemplate && (
        <StartCampDialog
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          campTemplate={{
            camp_type: campTemplate.camp_type,
            camp_name: campTemplate.camp_name,
            duration_days: campTemplate.duration_days,
            icon: campTemplate.icon
          }}
          onSuccess={(campId) => navigate(`/camp/${campId}`)}
        />
      )}
    </div>
  );
}