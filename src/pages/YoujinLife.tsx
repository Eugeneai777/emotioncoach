import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Search, ChevronRight, Lightbulb, ListTodo, Bell, Clock, ExternalLink, Wallet } from "lucide-react";
import AudienceHub from "@/components/energy-studio/AudienceHub";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

const placeholders = [
  "帮我找个保洁",
  "我今天很烦",
  "今晚吃什么",
  "附近有什么团购",
  "帮我做个决定",
  "最近压力好大",
];

const quickServices = [
  { emoji: "🧹", label: "保洁", prompt: "帮我找个附近的保洁服务", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "🔧", label: "维修", prompt: "水龙头漏水了，怎么修", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "🍜", label: "美食", prompt: "今晚吃什么？推荐一下", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "💰", label: "记账", prompt: "帮我记一笔账", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "🎯", label: "打卡", prompt: "__NAV__/youjin-life/habits", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "🤝", label: "互助", prompt: "__NAV__/youjin-life/help", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "🛒", label: "团购", prompt: "附近有什么社区团购", bg: "bg-white/10", ring: "ring-white/10" },
  { emoji: "💡", label: "更多", prompt: "你能帮我做什么", bg: "bg-white/10", ring: "ring-white/10" },
];

const communityServices = [
  {
    emoji: "🛒",
    title: "社区团购",
    desc: "邻居拼团更便宜",
    items: [
      { name: "有机草莓 3斤装", detail: "¥29.9", extra: "128人已买" },
      { name: "土鸡蛋 30枚", detail: "¥19.8", extra: "86人已买" },
    ],
    link: "https://youhui.pinduoduo.com",
    linkLabel: "去多多买菜",
    accent: "bg-orange-400",
    cardBg: "bg-white/[0.06]",
    borderColor: "border-white/[0.08]",
    iconColor: "text-orange-400",
  },
  {
    emoji: "🏪",
    title: "跳蚤市场",
    desc: "邻居闲置好物",
    items: [
      { name: "戴森吸尘器 V8（九成新）", detail: "¥800", extra: "3栋王姐" },
      { name: "儿童自行车", detail: "¥120", extra: "5栋李妈" },
    ],
    link: "https://www.xianyu.com",
    linkLabel: "去闲鱼看更多",
    accent: "bg-sky-400",
    cardBg: "bg-white/[0.06]",
    borderColor: "border-white/[0.08]",
    iconColor: "text-sky-400",
  },
  {
    emoji: "🎉",
    title: "社区活动",
    desc: "周末遛娃、兴趣班",
    items: [
      { name: "周六亲子手工课", detail: "本周六 14:00", extra: "活动中心" },
      { name: "瑜伽晨练班", detail: "每周一三五 7:00", extra: "小区花园" },
    ],
    accent: "bg-violet-400",
    cardBg: "bg-white/[0.06]",
    borderColor: "border-white/[0.08]",
    iconColor: "text-violet-400",
  },
];

const cases = [
  { emoji: "🧹", question: "帮我找个周末的保洁阿姨", result: "推荐3位 · 可跳转58到家预约", tag: "保洁", tagColor: "bg-sky-500/20 text-sky-300" },
  { emoji: "😰", question: "最近工作压力特别大", result: "情绪疏导 + 3条实用建议", tag: "减压", tagColor: "bg-emerald-500/20 text-emerald-300" },
  { emoji: "🍜", question: "今晚吃什么？不想吃辣", result: "3个推荐 · 可跳转美团下单", tag: "美食", tagColor: "bg-red-500/20 text-red-300" },
  { emoji: "🛒", question: "附近有什么团购？", result: "3个社区团 · 今日截单", tag: "团购", tagColor: "bg-amber-500/20 text-amber-300" },
  { emoji: "⚖️", question: "要不要跳槽？", result: "3维度对比分析 + 建议", tag: "决策", tagColor: "bg-violet-500/20 text-violet-300" },
  { emoji: "🏪", question: "想买个二手书架", result: "邻居在卖 · ¥150", tag: "闲置", tagColor: "bg-cyan-500/20 text-cyan-300" },
];

const todayCards = [
  { icon: Lightbulb, title: "今日建议", desc: "保持专注，适当休息", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { icon: ListTodo, title: "今日待办", desc: "还有 3 件事等你处理", color: "text-sky-400", bg: "bg-sky-500/15" },
  { icon: Bell, title: "AI 提醒", desc: "下午记得喝水哦", color: "text-amber-400", bg: "bg-amber-500/15" },
];

export default function YoujinLife() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recentItems] = useState([
    { text: "帮我找个保洁阿姨", time: "2小时前", done: false },
    { text: "附近有什么团购", time: "昨天", done: true },
    { text: "最近很焦虑", time: "3天前", done: true },
  ]);
  const [monthlyTotal, setMonthlyTotal] = useState<number | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(new Date()).toISOString();
      const { data } = await supabase
        .from("finance_records")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("created_at", start)
        .lte("created_at", end);
      if (data) {
        setMonthlyTotal(data.reduce((s, r) => s + Number(r.amount), 0));
        setMonthlyCount(data.length);
      }
    })();
  }, []);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q) return;
    navigate(`/youjin-life/chat?q=${encodeURIComponent(q)}`);
  };

  const handleQuickEntry = (prompt: string) => {
    if (prompt.startsWith("__NAV__")) {
      navigate(prompt.replace("__NAV__", ""));
      return;
    }
    navigate(`/youjin-life/chat?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 30%, #16213e 70%, #0f0f1a 100%)",
        WebkitOverflowScrolling: "touch",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* ===== 顶部标题 ===== */}
      <div className="relative px-4 pt-[calc(env(safe-area-inset-top,12px)+16px)] pb-4 overflow-hidden">
        {/* 装饰光晕 */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-sky-500/8 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-lg font-bold text-white">劲</span>
          </div>
          <h1 className="text-lg font-bold text-white leading-tight mt-3 tracking-wide">
            有劲AI · 一句话帮你搞定生活
          </h1>
          <p className="text-xs text-white/40 leading-tight mt-1.5">
            您专属的社区入口
          </p>
        </div>
      </div>

      {/* ===== 人群入口 ===== */}
      <div className="px-4 mb-5">
        <div className="bg-white/[0.06] rounded-2xl p-3.5 border border-white/[0.08] backdrop-blur-sm">
          <AudienceHub />
        </div>
      </div>

      {/* ===== 快捷服务网格 ===== */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {quickServices.map((s) => (
            <button
              key={s.label}
              onClick={() => handleQuickEntry(s.prompt)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span className={`text-2xl w-12 h-12 flex items-center justify-center ${s.bg} rounded-2xl ring-1 ${s.ring} backdrop-blur-sm`}>
                {s.emoji}
              </span>
              <span className="text-[11px] text-white/50 font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 本月消费摘要 ===== */}
      {monthlyTotal !== null && (
        <div className="px-4 mb-5">
          <button
            onClick={() => navigate("/youjin-life/expenses")}
            className="w-full bg-white/[0.06] rounded-2xl border border-white/[0.08] backdrop-blur-sm p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-white/40">本月消费</p>
              <p className="text-base font-bold text-white">¥{monthlyTotal.toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-white/30">{monthlyCount}笔</span>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
          </button>
        </div>
      )}

      {/* ===== 社区生活圈 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-white/90">🏘️ 小区生活圈</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
          {communityServices.map((svc, idx) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`shrink-0 w-56 ${svc.cardBg} rounded-2xl border ${svc.borderColor} backdrop-blur-sm overflow-hidden`}
            >
              <div className={`h-0.5 ${svc.accent}`} />
              <div className="px-3.5 py-2.5 flex items-center gap-2">
                <span className="text-lg">{svc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/90">{svc.title}</p>
                  <p className="text-[10px] text-white/40 truncate">{svc.desc}</p>
                </div>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {svc.items.map((item, i) => (
                  <div key={i} className="px-3.5 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/80 truncate">{item.name}</p>
                      <p className="text-[10px] text-white/35">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-white/25 shrink-0">{item.extra}</span>
                  </div>
                ))}
              </div>
              {svc.link ? (
                <a
                  href={svc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1 px-3.5 py-2.5 border-t border-white/[0.06] ${svc.iconColor} text-[11px] font-semibold active:bg-white/5 transition-colors`}
                >
                  {svc.linkLabel}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  onClick={() => handleQuickEntry(svc.title)}
                  className={`w-full flex items-center justify-center gap-1 px-3.5 py-2.5 border-t border-white/[0.06] ${svc.iconColor} text-[11px] font-semibold active:bg-white/5 transition-colors`}
                >
                  AI 帮你找
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== 真实案例 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-white/90">💬 真实案例</h2>
          <button
            onClick={() => navigate("/youjin-life/chat")}
            className="text-[11px] text-white/40 flex items-center gap-0.5"
          >
            查看更多
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none">
          {cases.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleQuickEntry(item.question)}
              className="shrink-0 w-36 bg-white/[0.06] rounded-2xl border border-white/[0.08] backdrop-blur-sm text-left active:scale-[0.97] transition-transform overflow-hidden"
            >
              <div className="p-3">
                <span className="text-xl">{item.emoji}</span>
                <p className="text-xs font-medium text-white/85 mt-2 line-clamp-2 leading-snug">
                  {item.question}
                </p>
                <p className="text-[10px] text-white/35 mt-1.5 line-clamp-1">{item.result}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${item.tagColor} font-medium mt-2`}>
                  {item.tag}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ===== 今日AI + 最近记录 ===== */}
      <div className="px-4 mb-6">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-9 bg-white/[0.06] rounded-xl mb-3 border border-white/[0.06]">
            <TabsTrigger value="today" className="text-xs text-white/50 rounded-lg data-[state=active]:bg-white/[0.1] data-[state=active]:text-white data-[state=active]:shadow-none">
              今日 AI
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs text-white/50 rounded-lg data-[state=active]:bg-white/[0.1] data-[state=active]:text-white data-[state=active]:shadow-none">
              最近记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <div className="bg-white/[0.06] rounded-2xl border border-white/[0.08] backdrop-blur-sm divide-y divide-white/[0.06]">
              {todayCards.map((card) => (
                <div key={card.title} className="flex items-center gap-3 px-3.5 py-3">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/85">{card.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="bg-white/[0.06] rounded-2xl border border-white/[0.08] backdrop-blur-sm divide-y divide-white/[0.06]">
              {recentItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3.5 py-3">
                  <Clock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <span className={`flex-1 text-xs ${item.done ? "text-white/25 line-through" : "text-white/70"}`}>
                    {item.text}
                  </span>
                  <span className="text-[10px] text-white/25">{item.time}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== 底部固定对话输入框 ===== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          background: "linear-gradient(180deg, rgba(15,15,26,0) 0%, rgba(15,15,26,0.95) 30%)",
        }}
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto px-3 py-2">
          <div className="flex-1 flex items-center gap-2 bg-white/[0.08] rounded-full px-3.5 py-2.5 border border-white/[0.1]">
            <Search className="w-4 h-4 text-white/25 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
              placeholder={placeholders[placeholderIdx]}
            />
            <button
              onClick={() => navigate("/youjin-life/chat?voice=1")}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.1] active:bg-white/15 shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-semibold active:opacity-80 shrink-0 transition-opacity shadow-lg shadow-violet-500/20"
          >
            搞定
          </button>
        </div>
      </div>
    </div>
  );
}
