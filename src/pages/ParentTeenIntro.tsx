import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { TeenModeOnboarding } from "@/components/parent-coach/TeenModeOnboarding";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  Shield, 
  Users, 
  Sparkles,
  Copy,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  INVITATION_SCRIPTS, 
  BEST_TIMING, 
  DUAL_TRACK_BENEFITS,
  HOW_IT_WORKS_STEPS,
  PRIVACY_COMMITMENTS
} from "@/config/teenModeGuidance";

export default function ParentTeenIntro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedScript, setExpandedScript] = useState<number | null>(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "话术已复制", description: "可以直接发送给孩子" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      <Helmet>
        <title>双轨模式介绍 - 有劲AI</title>
        <meta name="description" content="家长和孩子各有专属AI，安全成长" />
        <meta property="og:title" content="有劲AI • 双轨模式" />
        <meta property="og:description" content="家长和孩子各有专属AI，安全成长" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-parent-coach.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/parent/teen-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-teal-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">双轨模式介绍</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pb-24">
        {/* Hero Section */}
        <section className="px-4 py-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              让孩子也有一个安全角落
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              亲子教练双轨模式：家长和孩子各自拥有专属AI陪伴，在安全空间中成长，让关系自然改善
            </p>
          </motion.div>
        </section>

        {/* What is Dual Track Mode */}
        <section className="px-4 mb-8">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-500" />
                什么是双轨模式？
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                  <div className="text-2xl mb-2">👨‍👩‍👧</div>
                  <h4 className="font-medium text-sm mb-1">家长版</h4>
                  <p className="text-xs text-muted-foreground">
                    帮助你理解和调整情绪，学习更好的沟通方式
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl">
                  <div className="text-2xl mb-2">🧒</div>
                  <h4 className="font-medium text-sm mb-1">青少年版</h4>
                  <p className="text-xs text-muted-foreground">
                    给孩子一个不被评判的倾诉空间
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Benefits */}
        <section className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 px-1">为什么有效？</h3>
          <div className="space-y-3">
            {DUAL_TRACK_BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur border-0 shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-2xl">{benefit.icon}</span>
                    <div>
                      <h4 className="font-medium text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Privacy Commitment */}
        <section className="px-4 mb-8">
          <Card className="bg-gradient-to-br from-teal-100 to-cyan-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-teal-600" />
                隐私承诺
              </h3>
              <div className="space-y-3">
                {PRIVACY_COMMITMENTS.map((commitment, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <EyeOff className="h-3 w-3 text-teal-600" />
                    </div>
                    <p className="text-sm text-foreground">{commitment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 px-1">如何开始？</h3>
          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-teal-200" />
            <div className="space-y-4">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md z-10">
                    {step.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Invitation Scripts */}
        <section className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-500" />
            如何让孩子愿意用？
          </h3>
          <div className="space-y-3">
            {INVITATION_SCRIPTS.map((item, index) => (
              <Card 
                key={index} 
                className="bg-white/80 backdrop-blur border-0 shadow-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedScript(expandedScript === index ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium text-sm">{item.scenario}</span>
                    </div>
                    {expandedScript === index ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedScript === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <p className="text-sm text-foreground italic">"{item.script}"</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">💡 {item.tips}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyScript(item.script)}
                          className="h-8"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          复制
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Best Timing */}
        <section className="px-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 px-1">最佳时机建议</h3>
          <div className="space-y-2">
            {BEST_TIMING.map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-white/60 backdrop-blur rounded-lg"
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium">{item.timing}</p>
                  <p className="text-xs text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-teal-100">
        <Button
          onClick={() => setShowOnboarding(true)}
          className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
        >
          <Link2 className="h-5 w-5 mr-2" />
          开始邀请孩子
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <TeenModeOnboarding
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onGenerateCode={() => {
          // 生成绑定码后的回调
        }}
      />
    </div>
  );
}
