import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Calendar, MapPin, Lock, Hash, Sparkles, ArrowRight, MessageCircle, Heart, Brain, Users2, Smile, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicOGMeta from "@/components/common/DynamicOGMeta";

const MEETING_ID = "69070266792";
const MEETING_PWD = "888888";

const PAIN_POINTS = [
  { emoji: "😩", text: "学了AI却用不起来，不知道怎么变现" },
  { emoji: "🔍", text: "想进垂直领域，却找不到入口和方法" },
  { emoji: "💭", text: "不想一个人摸索，渴望真实的陪伴和关系" },
];

const HIGHLIGHTS = [
  { icon: "🎯", title: "AI落地路径", desc: "不是教你用工具，而是教你如何用AI+真实关系创造价值" },
  { icon: "🗺️", title: "垂直领域实操", desc: "从0到1进入AI教练赛道的完整路径与真实案例" },
  { icon: "🤝", title: "破圈行动指南", desc: "从围观者变成参与者，找到你的第一步" },
];

const USE_CASES = [
  { icon: <Heart className="h-5 w-5" />, title: "情绪教练", desc: "AI陪你梳理情绪，找到内在力量", color: "from-rose-500 to-pink-500" },
  { icon: <Brain className="h-5 w-5" />, title: "财富觉醒", desc: "突破限制性信念，重建金钱关系", color: "from-amber-500 to-yellow-500" },
  { icon: <Users2 className="h-5 w-5" />, title: "亲子沟通", desc: "用AI辅助理解孩子，改善亲子关系", color: "from-emerald-500 to-teal-500" },
  { icon: <Smile className="h-5 w-5" />, title: "生活教练", desc: "感恩日记、沟通教练，持续成长", color: "from-blue-500 to-indigo-500" },
];

export default function EventAIBreakthrough() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/20 to-background">
      <DynamicOGMeta pageKey="eventAIBreakthrough" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-5 pt-14 pb-12 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-6 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-8 left-12 text-4xl opacity-20">✨</div>
          <div className="absolute bottom-8 right-8 text-3xl opacity-20">🚀</div>
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            免费线上说明会 · 4月4日周六
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            普通人如何靠<br />
            <span className="bg-white/20 px-2 py-0.5 rounded-lg">"AI+真实关系"</span><br />
            破圈？
          </h1>
          <p className="text-white/85 text-sm leading-relaxed">
            这场线上会讲透了 · 欢迎带家人朋友一起来
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-5 pb-28">

        {/* 活动信息卡片 */}
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-5 space-y-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
            📋 活动信息
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-xl px-4 py-3">
              <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">时间</span>
                <p className="font-semibold text-foreground">4月4日（周六）20:00 - 22:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-xl px-4 py-3">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">地点</span>
                <p className="font-semibold text-foreground">腾讯会议（线上）</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 text-sm bg-muted/30 rounded-xl px-4 py-3">
                <Hash className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">会议号</span>
                  <p className="font-bold text-foreground tracking-wider">{MEETING_ID}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm bg-muted/30 rounded-xl px-4 py-3">
                <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">密码</span>
                  <p className="font-bold text-foreground tracking-wider">{MEETING_PWD}</p>
                </div>
              </div>
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
          <h2 className="font-semibold text-foreground text-center text-base">你是不是也这样？</h2>
          <div className="space-y-2.5">
            {PAIN_POINTS.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl px-4 py-3 border border-amber-100/50 dark:border-amber-900/20">
                <span className="text-xl shrink-0">{item.emoji}</span>
                <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground pt-1">
            别急，这场说明会，专为你准备 👇
          </p>
        </div>

        {/* 亮点 */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 space-y-4">
          <h2 className="font-semibold text-foreground text-center flex items-center justify-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            说明会你将收获
          </h2>
          <div className="space-y-3">
            {HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 有劲AI 介绍 + 案例 */}
        <div className="space-y-4">
          <div className="text-center space-y-1.5">
            <h2 className="font-bold text-foreground text-lg">🌟 什么是有劲AI？</h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
              有劲AI是一个<span className="text-foreground font-medium">「AI教练 × 真实关系」</span>平台，
              用温暖的AI陪伴 + 系统化工具 + 成长社群，帮助每个人在情绪、财富、亲子、沟通等领域持续成长。
            </p>
          </div>

          {/* 功能展示 */}
          <div className="grid grid-cols-2 gap-3">
            {USE_CASES.map((item, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-4 space-y-2 shadow-sm">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                  {item.icon}
                </div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 真实案例 */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200/40 dark:border-amber-800/20 p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-center text-sm flex items-center justify-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-amber-600" />
              真实用户反馈
            </h3>
            <div className="space-y-3">
              <div className="bg-card/80 rounded-xl p-3.5 border border-border/30 shadow-sm">
                <p className="text-xs text-foreground leading-relaxed italic">
                  "用了情绪教练之后，我学会了不压抑自己，和孩子的关系也好了很多。每天写感恩日记成了习惯。"
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-right">—— 一位妈妈用户</p>
              </div>
              <div className="bg-card/80 rounded-xl p-3.5 border border-border/30 shadow-sm">
                <p className="text-xs text-foreground leading-relaxed italic">
                  "财富觉醒训练营让我意识到很多隐藏的限制性信念，7天下来整个人通透了许多。"
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-right">—— 一位创业者</p>
              </div>
              <div className="bg-card/80 rounded-xl p-3.5 border border-border/30 shadow-sm">
                <p className="text-xs text-foreground leading-relaxed italic">
                  "AI教练不会评判我，随时可以聊，特别是深夜焦虑的时候，有种被接住的感觉。"
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-right">—— 一位职场人</p>
              </div>
            </div>
          </div>

          {/* 体验入口 */}
          <div
            onClick={() => navigate("/mini-app")}
            className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
              劲
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">立即体验有劲AI</p>
              <p className="text-xs text-muted-foreground mt-0.5">免费试用AI教练、情绪工具等全部功能</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* 邀请提示 */}
        <div className="text-center space-y-2 py-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full px-5 py-2">
            <span className="text-sm">🎁</span>
            <span className="text-sm font-medium text-foreground">欢迎带家人朋友一起来</span>
          </div>
          <p className="text-base font-bold text-foreground">周六晚八点，线上见！</p>
          <p className="text-xs text-muted-foreground">一起从围观到破圈 👇</p>
        </div>
      </div>

      {/* 底部固定 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-12 text-base font-semibold shadow-lg shadow-orange-500/20"
          >
            <Copy className="h-5 w-5" />
            {copied ? "会议号已复制 ✓" : "复制会议号，立即参加"}
          </Button>
        </div>
      </div>
    </div>
  );
}
