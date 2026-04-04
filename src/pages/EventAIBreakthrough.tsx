import { useState } from "react";
import { toast } from "sonner";
import { Copy, Calendar, MapPin, Lock, Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicOGMeta from "@/components/common/DynamicOGMeta";

const MEETING_ID = "69070266792";
const MEETING_PWD = "888888";

const PAIN_POINTS = [
  { emoji: "😩", text: "学了AI却用不起来" },
  { emoji: "🔍", text: "想进垂直领域却找不到入口" },
  { emoji: "💭", text: "不想一个人摸索，渴望真实的陪伴" },
];

const HIGHLIGHTS = [
  "如何用AI+真实关系打造个人竞争力",
  "垂直领域的实操路径与案例分享",
  "从围观到破圈的第一步行动指南",
];

export default function EventAIBreakthrough() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MEETING_ID);
      setCopied(true);
      toast.success("会议号已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-background">
      <DynamicOGMeta pageKey="eventAIBreakthrough" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-5 pt-12 pb-10 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-6xl">✨</div>
          <div className="absolute bottom-6 left-6 text-5xl">🚀</div>
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-3">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium">
            免费线上说明会
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            普通人如何靠<br />"AI+真实关系"破圈？
          </h1>
          <p className="text-white/90 text-sm">这场线上会讲透了</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-5 pb-32">
        {/* 活动信息卡片 */}
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-5 space-y-4">
          <h2 className="font-semibold text-foreground text-center text-lg">📋 活动信息</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-muted-foreground">时间：</span>
              <span className="font-medium text-foreground">4月4日（周六）20:00-22:00</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-muted-foreground">地点：</span>
              <span className="font-medium text-foreground">腾讯会议</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-muted-foreground">会议号：</span>
              <span className="font-bold text-foreground text-base tracking-wider">{MEETING_ID}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-muted-foreground">密码：</span>
              <span className="font-bold text-foreground text-base">{MEETING_PWD}</span>
            </div>
          </div>

          <Button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-11"
          >
            <Copy className="h-4 w-4" />
            {copied ? "已复制 ✓" : "一键复制会议号"}
          </Button>
        </div>

        {/* 痛点共鸣 */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-center">你是不是也这样？</h2>
          <div className="space-y-2.5">
            {PAIN_POINTS.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl px-4 py-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 亮点 */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-center flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            你将收获
          </h2>
          <div className="space-y-2">
            {HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <ArrowRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 邀请提示 */}
        <div className="text-center space-y-1 py-2">
          <p className="text-sm text-muted-foreground">🎁 欢迎带家人朋友一起来</p>
          <p className="text-sm font-medium text-foreground">周六晚八点，线上见！</p>
          <p className="text-xs text-muted-foreground mt-2">一起从围观到破圈 👇</p>
        </div>
      </div>

      {/* 底部固定 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-12 text-base font-semibold"
          >
            <Copy className="h-5 w-5" />
            {copied ? "会议号已复制 ✓" : "复制会议号，立即参加"}
          </Button>
        </div>
      </div>
    </div>
  );
}
