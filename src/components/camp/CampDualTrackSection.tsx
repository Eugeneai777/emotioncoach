import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  Shield, 
  Heart, 
  MessageCircle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Lock,
  Eye,
  Copy,
  Check
} from "lucide-react";
import { INVITATION_SCRIPTS, HOW_IT_WORKS_STEPS, PRIVACY_COMMITMENTS } from "@/config/teenModeGuidance";
import { useToast } from "@/hooks/use-toast";

interface CampDualTrackSectionProps {
  campType: string;
}

export const CampDualTrackSection = ({ campType }: CampDualTrackSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyScript = (script: string, index: number) => {
    navigator.clipboard.writeText(script);
    setCopiedIndex(index);
    toast({
      title: "已复制话术",
      description: "可以直接发给孩子啦"
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // 只显示前2个话术预览
  const previewScripts = INVITATION_SCRIPTS.slice(0, 2);

  return (
    <section className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 px-4 py-1">
          🧒 训练营专属功能
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">让孩子也加入成长</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          开启双轨模式，家长和孩子各有专属AI陪伴，共同成长
        </p>
      </div>

      {/* Core Value - Two Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">家长版</CardTitle>
                <p className="text-sm text-muted-foreground">你正在使用的</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              帮助你理解孩子、调整情绪、学习沟通技巧
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-500" />
                <span>专业亲子教练对话</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-500" />
                <span>情绪管理工具</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-500" />
                <span>训练营每日任务</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/30 dark:to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">青少年版</CardTitle>
                <p className="text-sm text-muted-foreground">孩子的专属空间</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              给孩子一个不被评判的倾诉空间，有温暖的AI陪伴
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-500" />
                <span>专属青少年AI伙伴</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-500" />
                <span>对话内容完全保密</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-500" />
                <span>懂TA的情绪支持</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Key Advantages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageCircle, title: "隐性桥梁", desc: "家长洞察帮AI更懂孩子", color: "from-teal-500 to-teal-600" },
          { icon: Lock, title: "绝对隐私", desc: "孩子对话完全保密", color: "from-cyan-500 to-teal-500" },
          { icon: Sparkles, title: "双向成长", desc: "各自成长，关系改善", color: "from-teal-400 to-cyan-500" },
          { icon: Shield, title: "专业陪伴", desc: "青少年心理特点引导", color: "from-cyan-400 to-teal-500" }
        ].map((item, index) => (
          <Card key={index} className="text-center p-4 hover:shadow-lg transition-all duration-300">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${item.color} text-white mb-3`}>
              <item.icon className="w-5 h-5" />
            </div>
            <h4 className="font-semibold mb-1">{item.title}</h4>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            如何开启双轨模式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="relative">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  {index < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-teal-300 to-cyan-300 -translate-y-1/2" />
                  )}
                </div>
                <div className="text-2xl">{step.icon}</div>
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invitation Scripts Preview */}
      <Card className="border-2 border-teal-200 dark:border-teal-800">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-500" />
            邀请话术参考
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            不知道怎么开口？试试这些温和的邀请方式
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={showAllScripts} onOpenChange={setShowAllScripts}>
            <div className="space-y-3">
              {previewScripts.map((script, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{script.icon}</span>
                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          {script.scenario}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">"{script.script}"</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyScript(script.script, index)}
                      className="flex-shrink-0"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <CollapsibleContent className="space-y-3 mt-3">
              {INVITATION_SCRIPTS.slice(2).map((script, index) => (
                <div 
                  key={index + 2}
                  className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{script.icon}</span>
                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          {script.scenario}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">"{script.script}"</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyScript(script.script, index + 2)}
                      className="flex-shrink-0"
                    >
                      {copiedIndex === index + 2 ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full mt-3 gap-2">
                {showAllScripts ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起话术
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    查看更多话术 ({INVITATION_SCRIPTS.length - 2}个)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Privacy Commitment */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield className="w-5 h-5" />
            隐私承诺
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRIVACY_COMMITMENTS.map((commitment, index) => (
              <div key={index} className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-800 dark:text-green-300">{commitment}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                家长只能看到：孩子的使用频率和整体心情趋势，不会看到任何对话内容
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button
          size="lg"
          onClick={() => navigate("/parent-teen-intro")}
          className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white shadow-lg"
        >
          了解双轨模式详情
          <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground">
          加入训练营后，可在亲子教练页面开启双轨模式
        </p>
      </div>
    </section>
  );
};
