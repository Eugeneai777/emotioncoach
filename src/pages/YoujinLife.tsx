import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Search, ChevronRight, Lightbulb, ListTodo, Bell, Clock, ArrowRight } from "lucide-react";
import { YoujinBottomNav } from "@/components/youjin-life/YoujinBottomNav";
import AudienceHub from "@/components/energy-studio/AudienceHub";
import logoImage from "@/assets/logo-youjin-ai.png";

const placeholders = [
  "帮我找个保洁",
  "我今天很烦",
  "今晚吃什么",
  "帮我做个决定",
  "找个维修师傅",
  "最近压力好大",
];

const quickServices = [
  { emoji: "🧹", label: "保洁", prompt: "帮我找个附近的保洁服务" },
  { emoji: "🔧", label: "维修", prompt: "水龙头漏水了，怎么修" },
  { emoji: "🚚", label: "搬家", prompt: "下周要搬家，东西不多" },
  { emoji: "🍜", label: "美食", prompt: "今晚吃什么？推荐一下" },
  { emoji: "😌", label: "减压", prompt: "最近工作压力特别大" },
  { emoji: "⚖️", label: "帮我选", prompt: "帮我做个选择" },
  { emoji: "📋", label: "待办", prompt: "帮我整理一下今天要做的事" },
  { emoji: "💡", label: "更多", prompt: "你能帮我做什么" },
];

const cases = [
  {
    emoji: "🧹",
    question: "帮我找个周末的保洁阿姨",
    result: "推荐3位 · 可跳转58到家预约",
    tag: "保洁",
  },
  {
    emoji: "😰",
    question: "最近工作压力特别大",
    result: "情绪疏导 + 3条实用建议",
    tag: "减压",
  },
  {
    emoji: "🍜",
    question: "今晚吃什么？不想吃辣",
    result: "3个推荐 · 可跳转美团下单",
    tag: "美食",
  },
  {
    emoji: "🔧",
    question: "水龙头漏水了",
    result: "推荐啄木鸟维修 · ¥80起",
    tag: "维修",
  },
  {
    emoji: "⚖️",
    question: "要不要跳槽？",
    result: "3维度对比分析 + 建议",
    tag: "决策",
  },
  {
    emoji: "🚚",
    question: "下周要搬家",
    result: "货拉拉¥180起 · 一键下单",
    tag: "搬家",
  },
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
    { text: "今晚吃什么", time: "昨天", done: true },
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
        background: "linear-gradient(180deg, #f8f6f3 0%, #ffffff 40%)",
        WebkitOverflowScrolling: "touch",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* ===== 顶部状态栏区域 ===== */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top,12px)+8px)]">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <img src={logoImage} alt="有劲AI" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">有劲AI</h1>
            <p className="text-[11px] text-gray-400 leading-tight">一句话帮你搞定生活</p>
          </div>
        </div>

        {/* ===== 搜索栏 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5 border border-gray-100 shadow-sm mb-4"
        >
          <Search className="w-4 h-4 text-gray-300 shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300"
            placeholder={placeholders[placeholderIdx]}
          />
          <button
            onClick={() => navigate("/youjin-life/chat?voice=1")}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 active:bg-gray-100"
          >
            <Mic className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium active:bg-gray-700"
          >
            搜索
          </button>
        </motion.div>
      </div>

      {/* ===== 人群入口 ===== */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100/80 shadow-sm">
          <AudienceHub />
        </div>
      </div>

      {/* ===== 快捷服务网格（小程序常见九宫格） ===== */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100/80 shadow-sm">
          <div className="grid grid-cols-4 gap-y-4">
            {quickServices.map((s) => (
              <button
                key={s.label}
                onClick={() => handleQuickEntry(s.prompt)}
                className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
              >
                <span className="text-2xl w-11 h-11 flex items-center justify-center bg-gray-50 rounded-xl">
                  {s.emoji}
                </span>
                <span className="text-[11px] text-gray-600 font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 真实案例横向滚动 ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 mb-2.5">
          <h2 className="text-sm font-bold text-gray-900">真实案例</h2>
          <button
            onClick={() => navigate("/youjin-life/chat")}
            className="text-[11px] text-gray-400 flex items-center gap-0.5"
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
              className="shrink-0 w-36 bg-white rounded-xl p-3 border border-gray-100/80 shadow-sm text-left active:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{item.emoji}</span>
              <p className="text-xs font-medium text-gray-900 mt-2 line-clamp-2 leading-snug">
                "{item.question}"
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-1">{item.result}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 mt-2">
                {item.tag}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ===== 今日 AI ===== */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-2.5">今日 AI</h2>
        <div className="bg-white rounded-xl border border-gray-100/80 shadow-sm divide-y divide-gray-50">
          {todayCards.map((card) => (
            <div key={card.title} className="flex items-center gap-3 px-3.5 py-3">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900">{card.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{card.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-200 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ===== 最近记录 ===== */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-2.5">最近记录</h2>
        <div className="bg-white rounded-xl border border-gray-100/80 shadow-sm divide-y divide-gray-50">
          {recentItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3.5 py-3">
              <Clock className="w-3.5 h-3.5 text-gray-200 shrink-0" />
              <span className={`flex-1 text-xs ${item.done ? "text-gray-300 line-through" : "text-gray-700"}`}>
                {item.text}
              </span>
              <span className="text-[10px] text-gray-300">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 底部悬浮对话入口 ===== */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,0px)]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/youjin-life/chat")}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg active:bg-gray-800"
        >
          👉 一句话，立即搞定
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      <YoujinBottomNav active="home" />
    </div>
  );
}
