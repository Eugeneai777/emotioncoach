import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Heart, Brain, Moon, Users, Compass, Eye, Search, Sparkles, Target, FileText, BarChart3, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { CoachStepsCard } from "@/components/coach/CoachStepsCard";


const GratitudeJournalIntro = () => {
  const navigate = useNavigate();
  const { data: template } = useCoachTemplate("gratitude_coach");

  const scienceCards = [
    {
      number: "①",
      title: "连续写 2–3 周感恩，幸福感提升 25%",
      source: "加州大学 Berkeley Greater Good Institute",
      points: [
        "幸福感 ↑ 25%",
        "焦虑、易怒 ↓ 明显下降",
        "情绪恢复能力 ↑ 显著提升"
      ],
      icon: Heart,
      gradient: "from-pink-500/20 to-rose-500/20"
    },
    {
      number: "②",
      title: "写感恩会让大脑从「紧绷模式」切回「正常模式」",
      source: "哈佛医学院",
      points: [
        "降低杏仁核（压力反应中心）活动",
        "提升前额叶皮层（决策与掌控中心）"
      ],
      conclusion: "写感恩会让你不再被情绪牵着走。",
      icon: Brain,
      gradient: "from-purple-500/20 to-indigo-500/20"
    },
    {
      number: "③",
      title: "感恩让睡眠变深、恢复变快",
      source: "UC Davis 情绪研究实验室",
      points: [
        "入睡更快",
        "夜间醒来更少",
        "睡得更扎实"
      ],
      conclusion: "比任何「冥想APP」「放松音乐」都更容易坚持，也更有效。",
      icon: Moon,
      gradient: "from-indigo-500/20 to-blue-500/20"
    },
    {
      number: "④",
      title: "感恩让人际关系修复、变暖、变近",
      source: "APA 美国心理协会",
      points: [
        "更愿意表达善意",
        "冲突减少",
        "与伴侣、家人、孩子的距离明显改善"
      ],
      conclusion: "因为你会重新看见生活里的「被支持感」。",
      icon: Users,
      gradient: "from-teal-500/20 to-cyan-500/20"
    },
    {
      number: "⑤",
      title: "感恩会让你看清方向与价值",
      source: "积极心理学权威 Martin Seligman",
      points: [
        "价值感",
        "方向感",
        "优势意识",
        "幸福敏感度"
      ],
      conclusion: "人生变得越来越清晰。",
      icon: Compass,
      gradient: "from-amber-500/20 to-orange-500/20"
    }
  ];

  const fourAStructure = [
    {
      letter: "A",
      english: "Aware",
      chinese: "看见当下（觉察）",
      description: "你的心、情绪、身体发生了什么？",
      detail: "它会温柔地帮你把「说不清的感受」，变成「被看见的自己」。",
      icon: Eye,
      gradient: "from-teal-400 to-cyan-400"
    },
    {
      letter: "A",
      english: "Appraise",
      chinese: "看懂事情（分析）",
      description: "它会帮你看懂事件本质：",
      points: ["哪里卡住？", "哪里误解了？", "哪里反而藏着意义？"],
      detail: "让你从混乱 → 回到掌控。",
      icon: Search,
      gradient: "from-cyan-400 to-blue-400"
    },
    {
      letter: "A",
      english: "Appreciate",
      chinese: "找到亮点（感恩的微幸福）",
      description: "不是强迫积极，而是在其中找到：",
      points: [
        "一点点温暖",
        "一点点支持",
        "一点点自己做得好的地方",
        "一点点「生活还没有完全糟糕」的证据"
      ],
      detail: "你的幸福，就从这些微亮点长出来。",
      icon: Sparkles,
      gradient: "from-pink-400 to-rose-400"
    },
    {
      letter: "A",
      english: "Align",
      chinese: "对齐力量（方向与意义）",
      description: "AI 会帮你把感恩点整合成：",
      points: [
        "你的力量（韧性、洞察、善良、行动力…）",
        "你的价值",
        "你的未来方向"
      ],
      detail: "它会告诉你，你正在成为怎样的人，未来应该往哪里走。",
      highlight: true,
      icon: Target,
      gradient: "from-amber-400 to-orange-400"
    }
  ];

  const exampleSentences = [
    "「今天阳光很好。」",
    "「孩子抱了我一下。」",
    "「我今天虽然累，但撑住了。」",
    "「朋友一句话让我暖了。」",
    "「我突然觉得自己没有那么糟。」"
  ];

  const aiFeatures = [
    "自动分类",
    "自动分析",
    "自动找亮点",
    "自动提炼意义",
    "自动生成报告",
    "自动画出趋势图"
  ];

  const reports = [
    {
      number: "①",
      title: "《今日感恩清单》",
      emoji: "📝",
      content: ["今日 3 个亮点", "一句力量宣言", "今日的小启发"],
      value: "让你意识到：「原来幸福一直都在，只是我今天终于看见它了。」",
      icon: FileText,
      gradient: "from-teal-500/20 to-cyan-500/20"
    },
    {
      number: "②",
      title: "《每周幸福报告》",
      emoji: "📊",
      content: [
        "哪些事情让你最幸福",
        "你的优势是什么",
        "哪些关系在托住你",
        "你这一周有多坚强",
        "你的能量在哪里提高、在哪里下降"
      ],
      value: "一周的模糊体验 → 被整理成清晰的幸福地图。",
      icon: BarChart3,
      gradient: "from-blue-500/20 to-indigo-500/20"
    },
    {
      number: "③",
      title: "《每月人生趋势报告》",
      emoji: "📈",
      highlight: "这是用户最惊艳的部分。",
      content: [
        "你的长期幸福趋势",
        "能量曲线（什么时候最容易低落）",
        "价值排序（你最重视什么）",
        "优势画像（你正在变成怎样的人）",
        "幸福触发地图",
        "生活方向建议"
      ],
      value: "你会第一次看见：「原来我的人生是有趋势、有方向、有线索的。」",
      icon: TrendingUp,
      gradient: "from-purple-500/20 to-pink-500/20"
    }
  ];

  const whyItWorks = [
    "看见自己",
    "看见幸福",
    "看见力量",
    "看见方向"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-amber-50">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-36 h-36 bg-amber-200/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-pink-600 hover:bg-pink-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-medium text-pink-800">我的感恩日记</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-pink-600 hover:bg-pink-50"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="relative max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full text-xs text-pink-700">
            <Sparkles className="w-3.5 h-3.5" />
            每天 1 分钟的幸福训练系统 + 人生趋势洞察工具
          </div>
          
          <h1 className="text-2xl font-bold text-pink-900">
            🌟 《有劲AI · 我的感恩日记》
          </h1>
          
          <p className="text-pink-700 leading-relaxed">
            💛 当生活变得很累时，"记录感恩"不是形式，而是让你慢慢好起来的方式。
          </p>

          <div className="bg-white/60 backdrop-blur rounded-2xl p-5 border border-pink-100/50 space-y-3">
            <p className="text-sm text-pink-800 font-medium">
              《我的感恩日记》不是一本传统日记，而是由有劲AI打造的
            </p>
            <p className="text-pink-600 text-sm">它帮助你：</p>
            <ul className="text-sm text-pink-700 space-y-1.5">
              <li>✨ 重新看见生活里的温柔</li>
              <li>✨ 重新感觉到力量和意义</li>
              <li>✨ 重新找回清晰感和方向</li>
              <li>✨ 重新知道人生可以往哪里走</li>
            </ul>
            <p className="text-xs text-pink-500 pt-2 border-t border-pink-100">
              你只写一句话，剩下的分析、洞察、总结，全部交给 AI。
            </p>
          </div>
        </section>

        {/* Section 01: Why Gratitude Journal */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-pink-900 flex items-center gap-2">
            🌱 01｜为什么写"感恩日记"？
            <span className="text-sm font-normal text-pink-600">因为它真的会改变你（科学印证）</span>
          </h2>
          <p className="text-sm text-pink-600">全世界顶尖机构已经证实：</p>

          <div className="space-y-3">
            {scienceCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${card.gradient} backdrop-blur rounded-xl p-4 border border-white/50 space-y-2`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-pink-900 text-sm">
                        {card.number} {card.title}
                      </h3>
                      <p className="text-xs text-pink-600 italic">{card.source}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-pink-800 space-y-1 ml-13">
                    {card.points.map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                  {card.conclusion && (
                    <p className="text-sm text-pink-700 font-medium pt-1 border-t border-pink-200/30">
                      {card.conclusion}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 02: What is Gratitude Journal */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-pink-900">
            🌿 02｜什么是《我的感恩日记》？
          </h2>
          <p className="text-sm text-pink-600">
            它不是普通日记，而是<strong>一套由 AI 引导、洞察、分析、总结的人生幸福系统。</strong>
          </p>
          <p className="text-sm text-pink-600">每次你写下一句话，它会带你完成 4A 幸福结构：</p>

          <div className="grid grid-cols-2 gap-3">
            {fourAStructure.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className={`bg-white/60 backdrop-blur rounded-xl p-4 border ${item.highlight ? 'border-pink-300 ring-2 ring-pink-200' : 'border-pink-100/50'} space-y-2`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-pink-500">{item.english}</p>
                    <h3 className="font-medium text-pink-900 text-sm">{item.chinese}</h3>
                  </div>
                  <p className="text-xs text-pink-700">{item.description}</p>
                  {item.points && (
                    <ul className="text-xs text-pink-600 space-y-0.5">
                      {item.points.map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-pink-800 font-medium">{item.detail}</p>
                  {item.highlight && (
                    <p className="text-xs text-pink-600 italic pt-1 border-t border-pink-200">
                      这是《我的感恩日记》最独特的地方
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 03: How to Record */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-pink-900">
            ✏️ 03｜如何记录？一句话就够。
          </h2>
          <p className="text-sm text-pink-600">
            你不需要写长文，不需要文笔，只需要一秒钟：
          </p>

          <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-pink-100/50 space-y-2">
            {exampleSentences.map((sentence, index) => (
              <p key={index} className="text-sm text-pink-700 italic">
                {sentence}
              </p>
            ))}
          </div>

          <p className="text-sm text-pink-600">剩下的事情全部由 AI 来完成：</p>

          <div className="flex flex-wrap gap-2">
            {aiFeatures.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full text-xs text-pink-700"
              >
                <CheckCircle2 className="w-3 h-3" />
                {feature}
              </span>
            ))}
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4 text-center space-y-1">
            <p className="text-sm text-pink-800 font-medium">你的任务只有一句话。</p>
            <p className="text-pink-700 font-bold">AI 负责帮你变幸福。</p>
          </div>
        </section>

        {/* Section 04: Reports */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-pink-900">
            📘 04｜《我的感恩日记》会生成哪些报告？
          </h2>
          <p className="text-sm text-pink-600">
            所有报告都不是装饰，而是"人生洞察工具"。
          </p>

          <div className="space-y-3">
            {reports.map((report, index) => {
              const IconComponent = report.icon;
              return (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${report.gradient} backdrop-blur rounded-xl p-4 border border-white/50 space-y-3`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-pink-900">
                        {report.number} {report.title}
                      </h3>
                      {report.highlight && (
                        <p className="text-xs text-pink-600 font-medium">{report.highlight}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-pink-600">AI 会告诉你：</p>
                    <ul className="text-sm text-pink-800 space-y-0.5">
                      {report.content.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-pink-200/30">
                    <p className="text-xs text-pink-600">价值：</p>
                    <p className="text-sm text-pink-800 font-medium">{report.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 05: Why It Works */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-pink-900">
            🌈 05｜为什么《我的感恩日记》真的能让人改变？
          </h2>
          <p className="text-sm text-pink-600">因为它让你每天都在练习：</p>

          <div className="grid grid-cols-2 gap-2">
            {whyItWorks.map((item, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur rounded-xl p-3 border border-pink-100/50 text-center"
              >
                <p className="text-pink-800 font-medium">• {item}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100/50 space-y-2">
            <p className="text-sm text-pink-700">
              改变不是某一天突然发生，
            </p>
            <p className="text-sm text-pink-800 font-medium">
              改变是你每天多看见一点点幸福、多理解一点点自己、多接住一点点力量。
            </p>
            <p className="text-pink-700 font-bold pt-2 border-t border-pink-200/30">
              幸福，就是这样练出来的。
            </p>
          </div>
        </section>

        {/* Gratitude Four Steps */}
        {template?.steps && Array.isArray(template.steps) && template.steps.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-pink-900">
              ✨ 感恩四部曲
            </h2>
            <CoachStepsCard
              title={template.steps_title || "感恩四部曲"}
              titleEmoji={template.steps_emoji || "✨"}
              steps={template.steps as any[]}
              primaryColor="pink"
            />
          </section>
        )}

        {/* Official Slogan */}
        <section className="text-center space-y-4">
          <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-amber-100 rounded-2xl p-6 border border-pink-200/50 space-y-3">
            <p className="text-xs text-pink-600">一句总结（官方 Slogan）</p>
            <h2 className="text-lg font-bold text-pink-900 leading-relaxed">
              《我的感恩日记》：<br/>
              带你看见幸福，看见亮点，<br/>
              也看见你的人生方向。
            </h2>
          </div>
        </section>

        {/* CTA Section */}
        <section className="space-y-3 pb-8">
          <Button
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-medium shadow-lg shadow-pink-200"
            onClick={() => navigate("/coach/gratitude_coach")}
          >
            🌸 开始记录我的感恩
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-pink-200 text-pink-700 hover:bg-pink-50 rounded-xl"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享给朋友
          </Button>
        </section>
      </main>
    </div>
  );
};

export default GratitudeJournalIntro;
