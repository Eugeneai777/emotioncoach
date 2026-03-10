import { useState } from "react";
import { LaogeToolCard } from "@/components/laoge/LaogeToolCard";
import { LaogeChat } from "@/components/laoge/LaogeChat";
import { Send } from "lucide-react";

const TOOLS = [
  {
    tool: "decision",
    title: "老哥，帮我做个决策",
    description: "有时候不是没有答案，只是需要一个人帮你看清。",
    icon: "⚖️",
    fields: [
      { key: "situation", label: "你现在在考虑什么决定？", placeholder: "简单描述你的情况..." },
      { key: "optionA", label: "A方案", placeholder: "第一个选择是..." },
      { key: "optionB", label: "B方案", placeholder: "第二个选择是..." },
    ],
  },
  {
    tool: "opportunity",
    title: "老哥，今年怎么赚钱",
    description: "今年还有什么赚钱机会？",
    icon: "💰",
    fields: [
      { key: "industry", label: "你的行业", placeholder: "比如：互联网、制造业、教育..." },
      { key: "city", label: "所在城市", placeholder: "比如：北京、深圳、成都..." },
      { key: "resources", label: "你现在拥有的资源", placeholder: "比如：人脉、资金、技术、经验..." },
    ],
  },
  {
    tool: "career",
    title: "老哥，我事业卡住了",
    description: "为什么事业越来越难？",
    icon: "🏔️",
    fields: [
      { key: "industry", label: "你现在做什么行业？", placeholder: "行业和具体职位..." },
      { key: "income", label: "目前收入区间？", placeholder: "比如：月薪2-3万", type: "select" as const, options: ["月薪1万以下", "月薪1-2万", "月薪2-3万", "月薪3-5万", "月薪5万以上", "创业中"] },
      { key: "painPoint", label: "最近最大的卡点？", placeholder: "你觉得最困扰你的是什么..." },
    ],
  },
  {
    tool: "stress",
    title: "老哥，我压力有点大",
    description: "中年男人压力指数测试",
    icon: "😤",
    fields: [
      { key: "work", label: "工作压力（1-10）", placeholder: "1=很轻松，10=快崩了", type: "select" as const, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      { key: "family", label: "家庭责任（1-10）", placeholder: "1=很轻松，10=压力山大", type: "select" as const, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      { key: "sleep", label: "睡眠质量差（1-10）", placeholder: "1=睡得很好，10=严重失眠", type: "select" as const, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      { key: "money", label: "经济压力（1-10）", placeholder: "1=没压力，10=很大", type: "select" as const, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      { key: "emotion", label: "情绪释放（1-10）", placeholder: "1=有很好的出口，10=完全没有", type: "select" as const, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
    ],
  },
  {
    tool: "health",
    title: "老哥，我身体有点不对",
    description: "40岁健康风险扫描",
    icon: "🏥",
    fields: [
      { key: "age", label: "年龄", placeholder: "比如：42", type: "select" as const, options: ["35-39岁", "40-44岁", "45-49岁", "50-55岁", "55岁以上"] },
      { key: "sleepHours", label: "每天睡眠时间", placeholder: "小时", type: "select" as const, options: ["不到5小时", "5-6小时", "6-7小时", "7-8小时", "8小时以上"] },
      { key: "exercise", label: "运动频率", placeholder: "选择", type: "select" as const, options: ["基本不运动", "每周1-2次", "每周3-4次", "每天都运动"] },
      { key: "weight", label: "体重情况", placeholder: "选择", type: "select" as const, options: ["偏瘦", "正常", "微胖（肚子有点大）", "明显超重"] },
    ],
  },
];

export default function LaogeAI() {
  const [dailyInput, setDailyInput] = useState("");
  const [dailySubmitted, setDailySubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--laoge-bg))]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--laoge-bg))] via-[hsl(var(--laoge-card))] to-[hsl(var(--laoge-bg))]" />
        <div className="relative px-5 pt-12 pb-8 text-center">
          <h1 className="text-4xl font-black text-[hsl(var(--laoge-text))] tracking-tight">
            老哥AI
          </h1>
          <p className="text-lg text-[hsl(var(--laoge-accent))] font-bold mt-2">
            有事问老哥
          </p>
          <p className="text-sm text-[hsl(var(--laoge-text-muted))] mt-2">
            男人的AI参谋
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {["事业", "赚钱", "决策", "压力", "健康"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[hsl(var(--laoge-accent)/0.15)] text-[hsl(var(--laoge-accent))] text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="px-4 pb-6 space-y-3 max-w-lg mx-auto">
        {TOOLS.map(t => (
          <LaogeToolCard key={t.tool} {...t} />
        ))}
      </div>

      {/* Daily Section */}
      <div className="px-4 pb-12 max-w-lg mx-auto">
        <div className="rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] p-5">
          <h2 className="text-base font-bold text-[hsl(var(--laoge-text))] mb-1">
            💬 今日老哥一句话
          </h2>
          <p className="text-xs text-[hsl(var(--laoge-text-muted))] mb-4">
            今天最重要的一件事是什么？
          </p>

          {!dailySubmitted ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                placeholder="说说你今天最重要的事..."
                className="flex-1 rounded-lg bg-[hsl(var(--laoge-bg))] border border-[hsl(var(--laoge-border))] text-[hsl(var(--laoge-text))] p-3 text-sm placeholder:text-[hsl(var(--laoge-text-muted))] focus:outline-none focus:border-[hsl(var(--laoge-accent))]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dailyInput.trim()) {
                    setDailySubmitted(true);
                  }
                }}
              />
              <button
                onClick={() => dailyInput.trim() && setDailySubmitted(true)}
                disabled={!dailyInput.trim()}
                className="p-3 rounded-lg bg-[hsl(var(--laoge-accent))] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <LaogeChat
              tool="daily"
              inputs={{ answer: dailyInput }}
              onReset={() => {
                setDailySubmitted(false);
                setDailyInput("");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
