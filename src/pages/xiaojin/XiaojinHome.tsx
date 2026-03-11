import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const entries = [
  { emoji: "🙂", label: "今天心情", desc: "3分钟情绪探索", path: "/xiaojin/mood", color: "from-orange-100 to-amber-50" },
  { emoji: "🧠", label: "我的天赋", desc: "发现隐藏超能力", path: "/xiaojin/talent", color: "from-blue-100 to-sky-50" },
  { emoji: "🚀", label: "未来方向", desc: "AI帮你看未来", path: "/xiaojin/future", color: "from-purple-100 to-violet-50" },
];

export default function XiaojinHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-white to-gray-50">
      <div className="max-w-md mx-auto px-5 pt-12 pb-8">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <span className="text-xs tracking-widest text-orange-400 font-medium">小劲AI · 与光同行</span>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            青少年AI成长实验室
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            每天3分钟<br />
            发现你的情绪 · 天赋 · 未来方向
          </p>
        </motion.div>

        {/* Entry Cards */}
        <div className="space-y-4 mb-10">
          {entries.map((item, i) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => navigate(item.path)}
              className={`w-full bg-gradient-to-r ${item.color} rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md`}
            >
              <span className="text-4xl">{item.emoji}</span>
              <div className="text-left">
                <div className="text-base font-semibold text-gray-800">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          ))}
        </div>

        {/* Daily Challenge Entry */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/xiaojin/challenge")}
          className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-2xl p-5 text-center active:scale-[0.98] transition-transform shadow-md hover:shadow-lg"
        >
          <div className="text-lg font-bold mb-1">🔥 成长100天挑战</div>
          <div className="text-xs opacity-90">每天一个问题，遇见更好的自己</div>
        </motion.button>

        {/* Social Proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-400 mt-8"
        >
          已有 30,000+ 青少年参与成长挑战
        </motion.p>

        {/* Footer Brand */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 pb-4"
        >
          <p className="text-[10px] text-gray-300">有劲AI · 让你天天都有劲</p>
        </motion.div>
      </div>
    </div>
  );
}
