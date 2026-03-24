import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Search, ChevronRight, Lightbulb, ListTodo, Bell, Clock, ExternalLink } from "lucide-react";
import AudienceHub from "@/components/energy-studio/AudienceHub";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const placeholders = [
  "帮我找个保洁",
  "我今天很烦",
  "今晚吃什么",
  "附近有什么团购",
  "帮我做个决定",
  "最近压力好大",
];

const quickServices = [
  { emoji: "🧹", label: "保洁", prompt: "帮我找个附近的保洁服务", bg: "bg-blue-50", ring: "ring-blue-100" },
  { emoji: "🔧", label: "维修", prompt: "水龙头漏水了，怎么修", bg: "bg-orange-50", ring: "ring-orange-100" },
  { emoji: "🚚", label: "搬家", prompt: "下周要搬家，东西不多", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  { emoji: "🍜", label: "美食", prompt: "今晚吃什么？推荐一下", bg: "bg-red-50", ring: "ring-red-100" },
  { emoji: "💰", label: "记账", prompt: "帮我记一笔账", bg: "bg-green-50", ring: "ring-green-100" },
  { emoji: "🛒", label: "团购", prompt: "附近有什么社区团购", bg: "bg-amber-50", ring: "ring-amber-100" },
  { emoji: "🏪", label: "跳蚤市场", prompt: "我想看看邻居在卖什么", bg: "bg-cyan-50", ring: "ring-cyan-100" },
  { emoji: "💡", label: "更多", prompt: "你能帮我做什么", bg: "bg-gray-50", ring: "ring-gray-100" },
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
    color: "bg-orange-50",
    iconColor: "text-orange-600",
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
    accent: "bg-blue-500",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    emoji: "🎉",
    title: "社区活动",
    desc: "周末遛娃、兴趣班",
    items: [
      { name: "周六亲子手工课", detail: "本周六 14:00", extra: "活动中心" },
      { name: "瑜伽晨练班", detail: "每周一三五 7:00", extra: "小区花园" },
    ],
    accent: "bg-purple-500",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const cases = [
  { emoji: "🧹", question: "帮我找个周末的保洁阿姨", result: "推荐3位 · 可跳转58到家预约", tag: "保洁", tagColor: "bg-blue-50 text-blue-600" },
  { emoji: "😰", question: "最近工作压力特别大", result: "情绪疏导 + 3条实用建议", tag: "减压", tagColor: "bg-emerald-50 text-emerald-600" },
  { emoji: "🍜", question: "今晚吃什么？不想吃辣", result: "3个推荐 · 可跳转美团下单", tag: "美食", tagColor: "bg-red-50 text-red-600" },
  { emoji: "🛒", question: "附近有什么团购？", result: "3个社区团 · 今日截单", tag: "团购", tagColor: "bg-amber-50 text-amber-600" },
  { emoji: "⚖️", question: "要不要跳槽？", result: "3维度对比分析 + 建议", tag: "决策", tagColor: "bg-violet-50 text-violet-600" },
  { emoji: "🏪", question: "想买个二手书架", result: "邻居在卖 · ¥150", tag: "闲置", tagColor: "bg-cyan-50 text-cyan-600" },
];

const todayCards = [
  { icon: Lightbulb, title: "今日建议", desc: "保持专注，适当休息", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: ListTodo, title: "今日待办", desc: "还有 3 件事等你处理", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Bell, title: "AI 提醒", desc: "下午记得喝水哦", color: "text-amber-600", bg: "bg-amber-50" },
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

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q) return;
    navigate(`/youjin-life/chat?q=${encodeURIComponent(q)}`);
  };

  const handleQuickEntry = (prompt: string) => {
    navigate(`/youjin-life/chat?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        background: "linear-gradient(180deg, #faf8f5 0%, #f5f3ef 15%, #ffffff 50%)",
        WebkitOverflowScrolling: "touch",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* ===== 顶部标题 + 品牌 ===== */}
      <div className="relative px-4 pt-[calc(env(safe-area-inset-top,12px)+12px)] pb-3 overflow-hidden">
        {/* 装饰圆 */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-100/30 blur-2xl" />
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-blue-100/20 blur-2xl" />
        <div className="relative flex flex-col items-center">
          <BrandLogo size="sm" />
          <h1 className="text-lg font-bold text-foreground leading-tight mt-2">
            有劲AI · 一句话帮你搞定生活
          </h1>
          <p className="text-xs text-muted-foreground leading-tight mt-1">
            您专属的社区入口
          </p>
        </div>
      </div>

      {/* ===== 人群入口 ===== */}
      <div className="px-4 mb-5">
        <div className="bg-card rounded-2xl p-3.5 border border-border/50 shadow-sm">
          <AudienceHub />
        </div>
      </div>

      {/* ===== 快捷服务网格 ===== */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {quickServices.map((s) => (
            <button
              key={s.label}
              onClick={() => handleQuickEntry(s.prompt)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span className={`text-2xl w-12 h-12 flex items-center justify-center ${s.bg} rounded-2xl ring-1 ${s.ring}`}>
                {s.emoji}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 社区生活圈 ===== */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-foreground">🏘️ 小区生活圈</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
          {communityServices.map((svc, idx) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="shrink-0 w-56 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
            >
              {/* 顶部色条 */}
              <div className={`h-1 ${svc.accent}`} />
              {/* Header */}
              <div className={`${svc.color} px-3.5 py-2.5 flex items-center gap-2`}>
                <span className="text-lg">{svc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{svc.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{svc.desc}</p>
                </div>
              </div>
              {/* Items */}
              <div className="divide-y divide-border/30">
                {svc.items.map((item, i) => (
                  <div key={i} className="px-3.5 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">{item.extra}</span>
                  </div>
                ))}
              </div>
              {/* Footer */}
              {svc.link ? (
                <a
                  href={svc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1 px-3.5 py-2.5 border-t border-border/30 ${svc.iconColor} text-[11px] font-semibold active:bg-accent/50 transition-colors`}
                >
                  {svc.linkLabel}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  onClick={() => handleQuickEntry(svc.title)}
                  className={`w-full flex items-center justify-center gap-1 px-3.5 py-2.5 border-t border-border/30 ${svc.iconColor} text-[11px] font-semibold active:bg-accent/50 transition-colors`}
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
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-foreground">💬 真实案例</h2>
          <button
            onClick={() => navigate("/youjin-life/chat")}
            className="text-[11px] text-muted-foreground flex items-center gap-0.5"
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
              className="shrink-0 w-36 bg-card rounded-2xl border border-border/50 shadow-sm text-left active:scale-[0.97] transition-transform overflow-hidden"
            >
              {/* 顶部色条 */}
              <div className={`h-0.5 ${item.tagColor.split(' ')[0].replace('50', '400')}`} />
              <div className="p-3">
                <span className="text-xl">{item.emoji}</span>
                <p className="text-xs font-medium text-foreground mt-2 line-clamp-2 leading-snug">
                  {item.question}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">{item.result}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${item.tagColor} font-medium mt-2`}>
                  {item.tag}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ===== 今日AI + 最近记录（Tab 合并）===== */}
      <div className="px-4 mb-6">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-9 bg-muted/50 rounded-xl mb-3">
            <TabsTrigger value="today" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              今日 AI
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              最近记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/30">
              {todayCards.map((card) => (
                <div key={card.title} className="flex items-center gap-3 px-3.5 py-3">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{card.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/30">
              {recentItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3.5 py-3">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                  <span className={`flex-1 text-xs ${item.done ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>
                    {item.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{item.time}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== 底部固定对话输入框 ===== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto px-3 py-2">
          <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3.5 py-2.5 border border-border/50">
            <Search className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
              placeholder={placeholders[placeholderIdx]}
            />
            <button
              onClick={() => navigate("/youjin-life/chat?voice=1")}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-background border border-border/50 active:bg-accent shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-full bg-foreground text-background text-xs font-semibold active:opacity-80 shrink-0 transition-opacity"
          >
            搞定
          </button>
        </div>
      </div>
    </div>
  );
}
