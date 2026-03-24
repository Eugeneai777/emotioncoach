import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Brain, Home, Scale, Lightbulb, ListTodo, Bell, Clock, ChevronRight } from "lucide-react";
import { YoujinBottomNav } from "@/components/youjin-life/YoujinBottomNav";
import AudienceHub from "@/components/energy-studio/AudienceHub";

const placeholders = [
  "帮我找个保洁",
  "我今天很烦",
  "今晚吃什么",
  "帮我做个决定",
  "找个维修师傅",
  "最近压力好大",
];

const quickEntries = [
  { label: "情绪一下", emoji: "🧠", prompt: "我今天心情不太好，想聊聊", gradient: "from-violet-50 to-purple-50", borderColor: "border-violet-100" },
  { label: "生活一下", emoji: "🏠", prompt: "帮我找个附近的保洁服务", gradient: "from-blue-50 to-cyan-50", borderColor: "border-blue-100" },
  { label: "帮我选", emoji: "⚖️", prompt: "帮我做个选择", gradient: "from-amber-50 to-orange-50", borderColor: "border-amber-100" },
];

const todayCards = [
  { icon: Lightbulb, title: "今日建议", desc: "保持专注，适当休息", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: ListTodo, title: "今日待办", desc: "还有 3 件事等你处理", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Bell, title: "AI 提醒", desc: "下午记得喝水哦", color: "text-amber-500", bg: "bg-amber-50" },
];

export default function YoujinLife() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    <div className="min-h-screen bg-white pb-24">
      {/* Audience Hub */}
      <div className="px-6 pt-10 pb-4">
        <AudienceHub />
      </div>

      {/* Hero */}
      <div className="pb-6 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 tracking-tight"
        >
          一句话，帮你搞定今天
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-base text-gray-400"
        >
          不需要思考，AI帮你安排好生活
        </motion.p>
      </div>

      {/* Core Input */}
      <div className="px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-all shadow-sm">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder:text-gray-300"
              placeholder={placeholders[placeholderIdx]}
            />
            <button
              onClick={() => navigate("/youjin-life/chat?voice=1")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Mic className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="mt-3 w-full py-3.5 rounded-2xl bg-gray-900 text-white font-medium text-base flex items-center justify-center gap-2 active:bg-gray-800 transition-colors"
          >
            👉 立即搞定
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Quick Entries */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {quickEntries.map((entry, i) => (
            <motion.button
              key={entry.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleQuickEntry(entry.prompt)}
              className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl bg-gradient-to-br ${entry.gradient} border ${entry.borderColor} transition-all`}
            >
              <span className="text-2xl">{entry.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{entry.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Real Use Cases */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">真实案例</h2>
        <div className="space-y-3">
          {[
            {
              emoji: "🧹",
              question: "帮我找个周末的保洁阿姨",
              answer: "已为你推荐3位附近保洁：李阿姨 ¥45/时 ⭐4.9，可直接跳转58到家预约。",
              tags: ["生活服务", "保洁"],
              prompt: "帮我找个周末的保洁阿姨",
            },
            {
              emoji: "😰",
              question: "最近工作压力特别大，不知道怎么办",
              answer: "听起来你最近挺累的。建议：① 今晚散步20分钟 ② 写3件今天的小确幸 ③ 周末给自己放半天假。",
              tags: ["情绪支持", "减压"],
              prompt: "最近工作压力特别大，不知道怎么办",
            },
            {
              emoji: "🍜",
              question: "今晚吃什么？不想吃辣的",
              answer: "推荐：① 清淡粤菜小炒 ② 日式定食套餐 ③ 意面沙拉轻食。可跳转美团查看附近餐厅。",
              tags: ["决策", "美食"],
              prompt: "今晚吃什么？不想吃辣的",
            },
            {
              emoji: "🔧",
              question: "水龙头漏水了，怎么修",
              answer: "建议找专业师傅上门维修。已推荐啄木鸟家庭维修，张师傅 ¥80起 ⭐4.9，0.8km内。",
              tags: ["生活服务", "维修"],
              prompt: "水龙头漏水了，怎么修",
            },
            {
              emoji: "⚖️",
              question: "要不要跳槽？现在的工作稳定但没成长",
              answer: "这个问题挺现实的。从收入、成长、风险3个维度分析后，建议先内部争取轮岗机会，同时更新简历。",
              tags: ["决策", "职业"],
              prompt: "要不要跳槽？现在的工作稳定但没成长",
            },
            {
              emoji: "🚚",
              question: "下周要搬家，东西不多",
              answer: "东西不多推荐货拉拉小面包车 ¥180起，好运搬家也不错 ¥150起。已生成一键下单链接。",
              tags: ["生活服务", "搬家"],
              prompt: "下周要搬家，东西不多",
            },
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickEntry(item.prompt)}
              className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">"{item.question}"</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.answer}</p>
                  <div className="flex gap-1.5 mt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200/60 text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>


      {/* Today AI Cards */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">今日 AI</h2>
        <div className="space-y-2.5">
          {todayCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{card.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">最近记录</h2>
        <div className="space-y-2">
          {recentItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <Clock className="w-4 h-4 text-gray-300 shrink-0" />
              <span className={`flex-1 text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                {item.text}
              </span>
              <span className="text-xs text-gray-300">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <YoujinBottomNav active="home" />
    </div>
  );
}
