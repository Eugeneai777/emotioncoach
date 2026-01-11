import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Eye, Heart, Lightbulb, Target, RefreshCw, MessageCircle, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

// 六大入口
const sixEntries = [
  { emoji: '🔥', name: '情绪', desc: '我现在感觉如何', color: 'from-red-500 to-orange-400' },
  { emoji: '💛', name: '感恩', desc: '今天有什么值得感谢', color: 'from-amber-500 to-yellow-400' },
  { emoji: '⚡', name: '行动', desc: '我想做什么但有点卡', color: 'from-blue-500 to-cyan-400' },
  { emoji: '🧩', name: '选择', desc: '我在纠结什么', color: 'from-purple-500 to-pink-400' },
  { emoji: '🤝', name: '关系', desc: '我想对谁说些什么', color: 'from-pink-500 to-rose-400' },
  { emoji: '🌟', name: '方向', desc: '我最近在想什么未来', color: 'from-teal-500 to-emerald-400' },
];

// 第二层：5件事
const fiveThings = [
  { icon: Eye, title: '看见状态', desc: '你现在最核心的是……' },
  { icon: Heart, title: '告诉正常', desc: '你这样感觉很可以理解……' },
  { icon: Lightbulb, title: '指出盲点', desc: '也许你忽略了……' },
  { icon: RefreshCw, title: '新角度', desc: '如果换一种方式看……' },
  { icon: Target, title: '微行动', desc: '现在做这一步就够了。' },
];

// 第四层选项
const supportOptions = [
  { emoji: '🌱', title: '加入训练营', desc: '21 天陪你建立新的习惯' },
  { emoji: '🌱', title: '预约真人教练', desc: '一次把关键问题理清' },
];

const TransformationFlow: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>四层支持系统 - 有劲AI</title>
        <meta name="description" content="有劲AI用四层方式陪你，从轻轻开始，到真正改变发生" />
        <meta property="og:title" content="有劲AI四层支持系统" />
        <meta property="og:description" content="从觉察→理解→行动→转化，AI教练陪你走完成长闭环" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/transformation-flow" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">四层支持系统</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-48 space-y-6">
          {/* Hero Section */}
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                有劲AI · 四层支持系统
              </h2>
            </div>
          </div>

          {/* 第一层：轻记录入口 */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">第一层</span>
                  <h3 className="font-semibold text-foreground">轻记录入口</h3>
                </div>
                <p className="text-sm text-muted-foreground">从一个很小的输入开始</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              你每天只需要做一件事：写下一点点你现在的状态。
            </p>

            <div className="grid grid-cols-2 gap-2">
              {sixEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${entry.color} flex items-center justify-center text-lg shrink-0`}>
                    {entry.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              你可以只点一下，也可以只写半句话。
            </p>

            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-sm text-amber-700 font-medium">
                📌 不需要想清楚，真实就好。
              </p>
            </div>
          </div>

          {/* 第二层：智能看见与温柔提醒 */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪞</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">第二层</span>
                  <h3 className="font-semibold text-foreground">智能看见与温柔提醒</h3>
                </div>
                <p className="text-sm text-muted-foreground">帮你看见你自己</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              每一次记录后，有劲AI 会帮你做 5 件事：
            </p>

            <div className="space-y-2">
              {fiveThings.map((thing, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                    <thing.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{thing.title}</p>
                    <p className="text-xs text-muted-foreground">「{thing.desc}」</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-blue-700">
                📌 不是分析你，是陪你站在你身边。
              </p>
              <p className="text-xs text-blue-600">
                如果你愿意，有劲AI 也可以帮你记得，在合适的时候温柔提醒你。
              </p>
            </div>
          </div>

          {/* 第三层：专业 AI 教练陪你深入 */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤍</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">第三层</span>
                  <h3 className="font-semibold text-foreground">专业 AI 教练陪你深入</h3>
                </div>
                <p className="text-sm text-muted-foreground">当你想多聊一点时</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              如果你发现：
            </p>

            <div className="space-y-2">
              {['这个问题反复出现', '你想更深入理一理', '你不想一个人想了'].map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {text}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              你可以直接点：
            </p>

            <div className="flex justify-center">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                继续深聊
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              有劲AI 会自动带你进入最适合你的专业教练，<br />
              比如情绪教练、行动教练、沟通教练、决策教练……
            </p>

            <p className="text-xs text-muted-foreground text-center">
              你不需要选择，系统已经帮你判断好了。
            </p>

            <div className="bg-purple-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-purple-700">
                📌 你只负责说真实的话，
              </p>
              <p className="text-sm text-purple-700">
                📌 理清这件事，是教练的工作。
              </p>
            </div>
          </div>

          {/* 第四层：真人教练与训练营支持 */}
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">第四层</span>
                  <h3 className="font-semibold text-foreground">真人教练与训练营支持</h3>
                </div>
                <p className="text-sm text-muted-foreground">当你需要被真正陪一段路</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              有些改变，不是一次对话就能完成的。
            </p>

            <p className="text-sm text-muted-foreground">
              当有劲AI 发现：
            </p>

            <div className="space-y-2">
              {[
                '同一个卡点反复出现',
                '情绪或关系已经影响生活',
                '你真的很想改变，但一个人有点难'
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {text}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              我们才会轻轻提醒你一句：
            </p>

            <div className="bg-teal-50/50 rounded-lg p-4 text-center">
              <p className="text-sm text-teal-700 italic">
                "这不是你想不通，<br />
                而是你需要被陪着走一段。"
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              这时，你可以选择：
            </p>

            <div className="grid grid-cols-2 gap-3">
              {supportOptions.map((option, i) => (
                <div
                  key={i}
                  className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200/50 text-center space-y-2"
                >
                  <div className="flex justify-center gap-2 text-lg">
                    {i === 0 ? <Calendar className="w-5 h-5 text-teal-600" /> : <Users className="w-5 h-5 text-teal-600" />}
                  </div>
                  <p className="text-sm font-medium text-foreground">{option.title}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-teal-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-teal-700">📌 没有强迫</p>
              <p className="text-sm text-teal-700">📌 没有推销</p>
              <p className="text-sm text-teal-700">📌 只在你真的需要的时候出现</p>
            </div>
          </div>

          {/* 一句话总结 */}
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 rounded-xl p-5 text-center border border-purple-200/50">
            <p className="text-foreground">
              你随时可以从一个很小的记录开始，<br />
              有劲AI 会陪你走到你真正想去的地方。
            </p>
          </div>

        </main>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto space-y-2">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              体验觉醒入口
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/awakening-intro')}
              className="w-full h-12 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              了解六大生命入口
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransformationFlow;
