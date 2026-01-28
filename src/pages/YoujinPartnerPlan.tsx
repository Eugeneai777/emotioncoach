import { ArrowLeft, Check, X, TrendingUp, Users, Zap, Target, Heart, Brain, Sparkles, Crown, Star, Diamond, Share2, AlertTriangle, Copy, Download, ChevronDown, Wallet, GraduationCap, Baby, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { youjinPartnerLevels } from "@/config/partnerLevels";
import { commissionableProducts } from "@/config/youjinPartnerProducts";
import { toast } from "sonner";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { executeOneClickShare, generateCanvas, canvasToBlob } from "@/utils/oneClickShare";
import ShareImagePreview from "@/components/ui/share-image-preview";
import PartnerPlanShareCard from "@/components/partner/PartnerPlanShareCard";
import { PartnerCardTemplateSelector } from "@/components/partner/PartnerCardTemplateSelector";
import { PartnerCardTemplate } from "@/config/partnerShareCardStyles";

const YoujinPartnerPlan = () => {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  
  // One-click share state
  const [isSharing, setIsSharing] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<PartnerCardTemplate>('classic');
  
  const posterRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 监听滚动显示浮动CTA
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        const scrollHeight = contentRef.current.scrollHeight;
        const clientHeight = contentRef.current.clientHeight;
        const scrollPercent = scrollTop / (scrollHeight - clientHeight);
        setShowFloatingCTA(scrollPercent > 0.3);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const handleShare = () => {
    setShowShareDialog(true);
  };

  // One-click share handler
  const handleOneClickShare = async () => {
    if (isSharing || !posterRef.current) return;
    
    setIsSharing(true);
    const toastId = toast.loading('正在生成海报...');

    try {
      await executeOneClickShare({
        cardRef: posterRef,
        cardName: '有劲合伙人计划',
        onProgress: (status) => {
          if (status === 'sharing') {
            toast.dismiss(toastId);
            toast.loading('正在分享...');
          } else if (status === 'done') {
            toast.dismiss(toastId);
            toast.success('分享成功');
          } else if (status === 'error') {
            toast.dismiss(toastId);
          }
        },
        onShowPreview: (blobUrl) => {
          toast.dismiss(toastId);
          setPreviewImageUrl(blobUrl);
          setShowImagePreview(true);
        },
        onSuccess: () => {},
        onError: (error) => {
          toast.dismiss(toastId);
          toast.error(error);
        },
      });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('生成失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  const closePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
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
      const canvas = await generateCanvas(posterRef);
      if (!canvas) {
        throw new Error("生成失败");
      }
      
      // 转换为 Blob
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        throw new Error("生成失败");
      }
      
      const file = new File([blob], "有劲合伙人计划.png", { type: "image/png" });
      
      // 优先使用系统分享 API（移动端）
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "有劲合伙人计划",
            text: "加入有劲合伙人，开启 AI 赋能之旅",
          });
          toast.success("分享成功");
          setShowShareDialog(false);
          return;
        } catch {
          // 系统分享取消，降级到下载
        }
      }
      
      // 降级：下载图片
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = '有劲合伙人计划.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("海报已保存", { description: "可以分享给朋友" });
      setShowShareDialog(false);
    } catch (error) {
      toast.error("生成失败", { description: "请稍后再试" });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // 净利润对比数据（基于新佣金：L1=18%, L2=30%+5%, L3=50%+12%）
  const profitData = [{
    name: '初级合伙人',
    净利润: 2169,  // 990 + 1971 - 792
    fill: '#f97316'
  }, {
    name: '高级合伙人',
    净利润: 18158,  // 4950 + 16425 - 3217
    fill: '#ea580c'
  }, {
    name: '钻石合伙人',
    净利润: 66544,  // 9900 + 54750 + 6844 - 4950
    fill: '#c2410c'
  }];

  // 收益构成数据（基于新佣金）
  const incomeBreakdownData = [{
    name: '初级',
    体验包收入: 990,
    '365佣金': 1971,  // 30 × (365 × 18%)
    二级佣金: 0
  }, {
    name: '高级',
    体验包收入: 4950,
    '365佣金': 16425,  // 150 × (365 × 30%)
    二级佣金: 0  // 实际有5%二级，简化展示
  }, {
    name: '钻石',
    体验包收入: 9900,
    '365佣金': 54750,  // 300 × (365 × 50%)
    二级佣金: 8213  // 二级12%
  }];

  const handleJoin = (levelId: string) => {
    const level = youjinPartnerLevels.find(l => l.level === levelId);
    if (level) {
      navigate('/partner/youjin-intro');
    }
  };

  return (
    <div 
      ref={contentRef}
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="youjinPartnerPlan" />
      
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* ========== 第一区块：Hero ========== */}
        <section className="text-center py-12 sm:py-16 relative overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-yellow-400/20 -skew-y-3 transform" />
          <div className="relative z-10">
            <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
              🌟 AI 时代最佳副业机会
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4 px-2">
              有劲合伙人 · 让 AI 为你赚钱
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              在 AI 大浪潮中，不被淘汰、反而靠 AI 赚到第一桶金
            </p>
          </div>
        </section>

        {/* ========== 第二区块：痛点与方案（01-03） ========== */}
        <div className="space-y-8 mb-12">
          {/* Section 01: 时代变了 */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🧭</span>
              <h2 className="text-lg sm:text-2xl font-bold">01｜时代变了：人人都在问——如何抓住 AI 机会？</h2>
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
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {['不需要技术', '不需要流量', '不需要拍视频', '不需要学习复杂 AI 工具'].map((item, i) => (
                <Card key={i} className="bg-green-50 border-green-200">
                  <CardContent className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-2">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">{item}</span>
                  </CardContent>
                </Card>
              ))}
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
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🔥</span>
              <h2 className="text-lg sm:text-2xl font-bold">02｜为什么大多数 AI 副业都难做？</h2>
            </div>

            <p className="text-lg">目前所有流行的 AI 赚钱方式，都有一个共同特点：</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {['门槛高', '竞争激烈', '需要专业技能', '不可复制', '无持续收入'].map((item, i) => (
                <Card key={i} className="bg-red-50 border-red-200">
                  <CardContent className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-2">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">{item}</span>
                  </CardContent>
                </Card>
              ))}
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
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🌈</span>
              <h2 className="text-lg sm:text-2xl font-bold">03｜有劲合伙人：AI 替你提供价值</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['你不需要变成专家', '你不需要做内容创作', '你不需要卖东西', '你不需要大量时间'].map((item, i) => (
                <Card key={i} className="bg-white/80">
                  <CardContent className="p-4 text-center">
                    <span className="text-sm">{item}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-6 text-center">
                <p className="text-lg">你只有一个任务：</p>
                <p className="text-2xl font-bold mt-2">✔ 分享你自己的真实成长故事。</p>
              </CardContent>
            </Card>

            <p className="text-lg text-center">剩下所有的价值创造，都由 AI 完成：</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['AI 陪伴用户', 'AI 分析情绪', 'AI 生成报告', 'AI 引导用户升级', 'AI 负责长期留存', 'AI 推动训练营转化', 'AI 让用户越来越离不开'].map((item, i) => (
                <Card key={i} className="bg-orange-50 border-orange-200">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xl font-bold text-center text-orange-600">
              你做得越真实，AI 帮你赚钱的力量越强。
            </p>
          </section>
        </div>

        {/* ========== 第三区块：深度内容（04-07）折叠Accordion ========== */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-muted-foreground">
              📚 深度了解（可展开）
            </Badge>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {/* Section 04: 为什么有劲AI产品是刚需 */}
            <AccordionItem value="section-04" className="border rounded-xl bg-white/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-orange-50/50 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">04｜为什么"有劲AI产品"是刚需？</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-1">情绪健康 × 财富成长 × 亲子关系 三大刚需赛道</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  <p className="text-base">有劲AI覆盖三大刚需场景，每个都是全民痛点：</p>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* 情绪健康 */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="h-5 w-5 text-blue-500" />
                          <p className="text-sm text-blue-600 font-bold">情绪健康赛道</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">📌 WHO 2023</p>
                        <ul className="space-y-1 text-sm">
                          <li>• 42% 成年人长期心理压力</li>
                          <li>• 70% 未获得情绪支持</li>
                          <li>• 情绪是效率下降第一原因</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* 财富成长 */}
                    <Card className="border-l-4 border-l-amber-500">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="h-5 w-5 text-amber-500" />
                          <p className="text-sm text-amber-600 font-bold">财富成长赛道</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">📌 麦肯锡 2024</p>
                        <ul className="space-y-1 text-sm">
                          <li>• 68% 中产阶层有财富焦虑</li>
                          <li>• 多数人卡在"认知卡点"</li>
                          <li>• AI财富教练需求激增</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* 亲子关系 */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Baby className="h-5 w-5 text-green-500" />
                          <p className="text-sm text-green-600 font-bold">亲子关系赛道</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">📌 教育部 2024</p>
                        <ul className="space-y-1 text-sm">
                          <li>• 青少年心理问题检出率 20%+</li>
                          <li>• 85% 家长感到"教育焦虑"</li>
                          <li>• 亲子沟通成为核心痛点</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300">
                    <CardContent className="p-5 text-center">
                      <p className="text-base font-bold text-orange-800">
                        有劲AI覆盖情绪 × 财富 × 亲子三大场景 = 最大刚需 × 最高复购 × 最强变现
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 05: 有劲产品生态 */}
            <AccordionItem value="section-05" className="border rounded-xl bg-white/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-orange-50/50 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">05｜有劲产品生态：11款可分成产品</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-1">覆盖情绪、财富、亲子三大场景</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  <p className="text-base">有劲提供完整的产品矩阵，每款都可获得佣金：</p>

                  {/* 产品分类展示 */}
                  <div className="space-y-3">
                    {/* 基础产品 */}
                    <Card className="border-l-4 border-l-blue-400">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🎫</span>
                          <p className="font-bold text-sm">基础产品（4款 × ¥9.9）</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">尝鲜会员</Badge>
                          <Badge variant="secondary">情绪健康测评</Badge>
                          <Badge variant="secondary">SCL-90心理测评</Badge>
                          <Badge variant="secondary">财富卡点测评</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 年度会员 */}
                    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📅</span>
                          <p className="font-bold text-sm">年度会员（1款）</p>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">核心分成来源</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-amber-500 text-white">365会员 ¥365</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 训练营 */}
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🔥</span>
                          <p className="font-bold text-sm">训练营（3款 × ¥299）</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">21天情绪日记训练营</Badge>
                          <Badge variant="secondary">财富觉醒训练营</Badge>
                          <Badge variant="secondary">青少年困境突破营</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 合伙人套餐 */}
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">💎</span>
                          <p className="font-bold text-sm">合伙人套餐（3款）</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">初级 ¥792</Badge>
                          <Badge variant="secondary">高级 ¥3217</Badge>
                          <Badge variant="secondary">钻石 ¥4950</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
                    <CardContent className="p-5">
                      <p className="text-base">产品覆盖用户全生命周期：</p>
                      <blockquote className="text-lg font-bold text-orange-700 mt-2">
                        体验包引流 → 测评破冰 → 训练营深度服务 → 年度会员持续变现
                      </blockquote>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CardContent className="p-5 text-center">
                      <p className="text-xl font-bold">11款产品 × 三大场景 = 多元收益来源</p>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 06: 三层影响力系统 */}
            <AccordionItem value="section-06" className="border rounded-xl bg-white/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-orange-50/50 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">06｜AI 替你赚钱的"三层影响力系统"</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-1">能力资产化、信任入口、收益复利</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-5">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-bold text-base">第一层：能力资产化</h4>
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
                      <CardContent className="p-5">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Heart className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-bold text-base">第二层：信任入口</h4>
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
                      <CardContent className="p-5">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-bold text-base">第三层：收益复利</h4>
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 07: 五层增长飞轮 */}
            <AccordionItem value="section-07" className="border rounded-xl bg-white/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-orange-50/50 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🔁</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">07｜五层增长飞轮（核心机制）</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-1">故事→惊艳→依赖→收益→裂变</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-300 via-amber-400 to-yellow-500" />
                    
                    <div className="space-y-4">
                      {[
                        { num: '1️⃣', title: '故事吸引', desc: '分享你的真实成长故事' },
                        { num: '2️⃣', title: '体验包产生惊艳', desc: '4项体验权益（50点对话 + 3项测评）低门槛体验' },
                        { num: '3️⃣', title: 'AI 陪伴形成依赖', desc: 'AI情绪教练/财富教练/亲子教练持续陪伴' },
                        { num: '4️⃣', title: '自然升级形成收益', desc: '用户升级365会员 或 购买训练营（情绪/财富/亲子）' },
                        { num: '5️⃣', title: '团队裂变形成复利', desc: '用户成为新合伙人继续传播' }
                      ].map((item, i) => (
                        <div key={i} className="relative pl-14">
                          <div className="absolute left-3 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </div>
                          <Card className="bg-white/80">
                            <CardContent className="p-4">
                              <p className="font-bold">{item.num} {item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300">
                    <CardContent className="p-5 text-center">
                      <p className="text-lg font-bold text-orange-800">
                        越滚越大、越滚越快。
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* ========== 可分成产品一览 ========== */}
        <section className="mb-12 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            可分成产品一览（11款）
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {commissionableProducts.map((product) => (
              <Card key={product.name} className={`transition-all duration-200 hover:shadow-md ${product.highlight ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : ''}`}>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category} · ¥{product.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ========== 第四区块：行动区（08-10） ========== */}
        <div className="space-y-12">
          {/* Section 08: 合伙人等级 */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧩</span>
              <h2 className="text-2xl font-bold">08｜合伙人等级</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* L1 */}
              <Card className="bg-gradient-to-br from-orange-400 to-amber-400 text-white overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
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
                      18%全产品佣金
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
              <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
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
                      30%全产品佣金
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      5%二级佣金
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      优先活动
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* L3 */}
              <Card className="bg-gradient-to-br from-orange-600 to-amber-600 text-white overflow-hidden relative transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]">
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
                      <span className="font-bold">12%二级佣金</span>
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

            {/* 净利润对比图表 - 增大高度 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 text-center">净利润对比</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={value => `¥${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '净利润']} />
                      <Bar dataKey="净利润" radius={[4, 4, 0, 0]}>
                        {profitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="净利润" position="top" formatter={(value: number) => `¥${value.toLocaleString()}`} style={{ fontSize: 12, fontWeight: 600 }} />
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
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={value => `¥${(value / 1000).toFixed(0)}k`} />
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
                          <td className="py-2">30 ×（365 × 18%）</td>
                          <td className="py-2 text-right font-medium">¥1,971</td>
                        </tr>
                        <tr className="border-b bg-orange-50">
                          <td className="py-2 font-bold">总收入</td>
                          <td className="py-2 text-right font-bold text-orange-600">¥2,961</td>
                        </tr>
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                          <td className="py-3 font-bold text-base">净利润</td>
                          <td className="py-3 text-right font-bold text-xl text-green-600">¥2,169</td>
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
                          <td className="py-2">150 ×（365 × 30%）</td>
                          <td className="py-2 text-right font-medium">¥16,425</td>
                        </tr>
                        <tr className="border-b bg-orange-50">
                          <td className="py-2 font-bold">总收入</td>
                          <td className="py-2 text-right font-bold text-orange-600">¥21,375</td>
                        </tr>
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                          <td className="py-3 font-bold text-base">净利润</td>
                          <td className="py-3 text-right font-bold text-xl text-green-600">¥18,158</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    另有5%二级佣金可拓展团队收益
                  </p>
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
          <section className="space-y-6 py-8">
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
              <Button 
                className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" 
                onClick={() => navigate('/partner/youjin-intro')}
              >
                了解详情并加入
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-14 text-lg border-orange-300 text-orange-600 hover:bg-orange-50" 
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 mr-2" />
                分享给朋友
              </Button>
            </div>
          </section>
        </div>

        {/* Bottom spacing for floating CTA */}
        <div className="h-24 sm:h-8" />
      </div>

      {/* ========== 浮动底部CTA（移动端） ========== */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div 
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t shadow-lg py-3 px-4 sm:hidden"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ transform: "translateZ(0)" }}
          >
            <div className="flex gap-3 max-w-lg mx-auto">
              <Button 
                className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base font-semibold"
                onClick={() => navigate('/partner/youjin-intro')}
              >
                立即加入
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-12 border-orange-300 text-orange-600 hover:bg-orange-50 text-base"
                onClick={handleOneClickShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                {isSharing ? '生成中...' : '一键分享'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Share Card for Screenshot */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: 0, 
          pointerEvents: 'none',
          opacity: 0.01,
        }}
        aria-hidden="true"
      >
        <PartnerPlanShareCard ref={posterRef} template={selectedTemplate} />
      </div>

      {/* Share Image Preview (for WeChat/iOS long-press save) */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={closePreview}
        imageUrl={previewImageUrl}
      />

      {/* Share Dialog (fallback with copy link) */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>分享有劲合伙人计划</DialogTitle>
            <DialogDescription>选择分享方式</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Selector */}
            <PartnerCardTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />

            {/* Preview */}
            <div className="flex justify-center">
              <div className="transform scale-[0.55] origin-top -my-16">
                <PartnerPlanShareCard template={selectedTemplate} />
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-14 flex-col gap-1"
                onClick={handleCopyLink}
              >
                <Copy className="h-5 w-5 text-orange-500" />
                <span className="text-xs">复制链接</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-1"
                onClick={handleGeneratePoster}
                disabled={isGeneratingPoster}
              >
                <Download className="h-5 w-5 text-orange-500" />
                <span className="text-xs">{isGeneratingPoster ? '生成中...' : '保存海报'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YoujinPartnerPlan;
