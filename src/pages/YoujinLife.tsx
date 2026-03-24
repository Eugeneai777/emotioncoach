import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Search, ChevronRight, Lightbulb, ListTodo, Bell, Clock, ExternalLink, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  { emoji: "🔧", label: "维修", prompt: "水龙头漏水了，怎么修", gradient: "from-orange-400 to-amber-300" },
  { emoji: "💰", label: "记账", prompt: "帮我记一笔账", gradient: "from-emerald-400 to-teal-300" },
  { emoji: "🎯", label: "打卡", prompt: "__NAV__/youjin-life/habits", gradient: "from-sky-400 to-blue-300" },
  { emoji: "🤝", label: "互助", prompt: "__NAV__/youjin-life/help", gradient: "from-pink-400 to-rose-300" },
  { emoji: "🛒", label: "团购", prompt: "附近有什么社区团购", gradient: "from-violet-400 to-purple-300" },
  { emoji: "💡", label: "更多", prompt: "你能帮我做什么", gradient: "from-gray-400 to-slate-300" },
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
    accent: "bg-orange-500",
    accentLight: "bg-orange-50",
    textAccent: "text-orange-600",
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
    accent: "bg-sky-500",
    accentLight: "bg-sky-50",
    textAccent: "text-sky-600",
  },
  {
    emoji: "🎉",
    title: "社区活动",
    desc: "周末遛娃、兴趣班",
    items: [
      { name: "周六亲子手工课", detail: "本周六 14:00", extra: "活动中心" },
      { name: "瑜伽晨练班", detail: "每周一三五 7:00", extra: "小区花园" },
    ],
    accent: "bg-violet-500",
    accentLight: "bg-violet-50",
    textAccent: "text-violet-600",
  },
];

const cases = [
  { emoji: "🧹", question: "帮我找个周末的保洁阿姨", result: "推荐3位 · 可跳转58到家预约", tag: "保洁", tagBg: "bg-sky-50", tagText: "text-sky-600" },
  { emoji: "😰", question: "最近工作压力特别大", result: "情绪疏导 + 3条实用建议", tag: "减压", tagBg: "bg-emerald-50", tagText: "text-emerald-600" },
  { emoji: "🍜", question: "今晚吃什么？不想吃辣", result: "3个推荐 · 可跳转美团下单", tag: "美食", tagBg: "bg-red-50", tagText: "text-red-600" },
  { emoji: "🛒", question: "附近有什么团购？", result: "3个社区团 · 今日截单", tag: "团购", tagBg: "bg-amber-50", tagText: "text-amber-600" },
  { emoji: "⚖️", question: "要不要跳槽？", result: "3维度对比分析 + 建议", tag: "决策", tagBg: "bg-violet-50", tagText: "text-violet-600" },
];

const todayCards = [
  { icon: Lightbulb, title: "今日建议", desc: "保持专注，适当休息", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: ListTodo, title: "今日待办", desc: "还有 3 件事等你处理", color: "text-sky-500", bg: "bg-sky-50" },
  { icon: Bell, title: "AI 提醒", desc: "下午记得喝水哦", color: "text-amber-500", bg: "bg-amber-50" },
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-24">
      {/* ===== Hero Header ===== */}
      <div
        className="relative overflow-hidden px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 20px)", paddingBottom: "24px" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-sky-100/50 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <BrandLogo size="md" />
          </motion.div>
          <h1 className="text-lg font-bold text-foreground tracking-tight mt-2.5">
            有劲AI生活助手
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            您专属的社区入口
          </p>
        </div>
      </div>

      {/* ===== 人群入口 ===== */}
      <div className="px-4 mb-5">
        <div className="bg-card rounded-2xl p-3.5 shadow-sm border border-border/50">
          <AudienceHub />
        </div>
      </div>

      {/* ===== 快捷服务 ===== */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {quickServices.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleQuickEntry(s.prompt)}
              className="flex items-center gap-2.5 bg-card rounded-xl p-3 border border-border/40 shadow-sm active:scale-[0.97] transition-all hover:shadow-md"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                <span className="text-base">{s.emoji}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ===== 本月消费摘要 ===== */}
      {monthlyTotal !== null && (
        <div className="px-4 mb-5">
          <button
            onClick={() => navigate("/youjin-life/expenses")}
            className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4 flex items-center gap-3.5 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-muted-foreground">本月消费</p>
              <p className="text-xl font-bold text-foreground mt-0.5">¥{monthlyTotal.toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground bg-white/80 px-2 py-0.5 rounded-full">{monthlyCount}笔</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </button>
        </div>
      )}

      {/* ===== 社区生活圈 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>🏘️</span> 小区生活圈
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
          {communityServices.map((svc, idx) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="shrink-0 w-60 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
            >
              {/* Top accent bar */}
              <div className={`h-1 ${svc.accent}`} />
              <div className="px-4 py-3 flex items-center gap-2.5">
                <span className="text-xl">{svc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{svc.title}</p>
                  <p className="text-[11px] text-muted-foreground">{svc.desc}</p>
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {svc.items.map((item, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground/90 truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">{item.extra}</span>
                  </div>
                ))}
              </div>
              {svc.link ? (
                <a
                  href={svc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border/40 ${svc.textAccent} text-xs font-semibold hover:bg-muted/30 transition-colors`}
                >
                  {svc.linkLabel}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => handleQuickEntry(svc.title)}
                  className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border/40 ${svc.textAccent} text-xs font-semibold hover:bg-muted/30 transition-colors`}
                >
                  AI 帮你找
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== 真实案例 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>💬</span> 真实案例
          </h2>
          <button
            onClick={() => navigate("/youjin-life/chat")}
            className="text-xs text-muted-foreground flex items-center gap-0.5 hover:text-foreground transition-colors"
          >
            查看更多
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none">
          {cases.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleQuickEntry(item.question)}
              className="shrink-0 w-40 bg-card rounded-2xl border border-border/50 shadow-sm text-left active:scale-[0.97] transition-all hover:shadow-md overflow-hidden"
            >
              <div className="p-3.5">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-xs font-medium text-foreground mt-2.5 line-clamp-2 leading-relaxed">
                  {item.question}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">{item.result}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${item.tagBg} ${item.tagText} font-medium mt-2.5`}>
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
          <TabsList className="w-full grid grid-cols-2 h-9 bg-muted/60 rounded-xl mb-3">
            <TabsTrigger value="today" className="text-xs rounded-lg data-[state=active]:shadow-sm">
              今日 AI
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs rounded-lg data-[state=active]:shadow-sm">
              最近记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/40">
              {todayCards.map((card) => (
                <div key={card.title} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/40">
              {recentItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Clock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <span className={`flex-1 text-sm ${item.done ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>
                    {item.text}
                  </span>
                  <span className="text-xs text-muted-foreground/50">{item.time}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== 底部固定对话输入框 ===== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/30"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2.5 max-w-lg mx-auto px-4 py-2.5">
          <div className="flex-1 flex items-center gap-2.5 bg-muted/60 rounded-full px-4 py-2.5 border border-border/50">
            <Search className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              placeholder={placeholders[placeholderIdx]}
            />
            <button
              onClick={() => navigate("/youjin-life/chat?voice=1")}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-background border border-border/60 active:bg-muted shrink-0 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 text-white text-sm font-semibold active:opacity-80 shrink-0 transition-opacity shadow-md shadow-violet-200"
          >
            搞定
          </button>
        </div>
      </div>
    </div>
  );
}
