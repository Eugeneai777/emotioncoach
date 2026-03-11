import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

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
          <span className="text-2xl font-bold tracking-widest text-orange-400">小劲AI · 与光同行</span>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
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

        {/* Voice Chat Circle Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <button
            onClick={() => navigate("/xiaojin/voice")}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="开始AI小劲语音对话"
          >
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/30 to-amber-400/30 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '140px', height: '140px', margin: '-10px' }}
            />

            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-orange-400/50"
              animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              style={{ width: '120px', height: '120px' }}
            />

            {/* Main button */}
            <motion.div
              className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 shadow-2xl flex flex-col items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ boxShadow: '0 10px 40px -10px rgba(251, 146, 60, 0.5), 0 0 60px rgba(251, 191, 36, 0.2)' }}
            >
              <Phone className="h-8 w-8 text-white mb-1" />
              <span className="text-xs font-semibold text-white">随时聊</span>
            </motion.div>
          </button>

          <p className="mt-4 text-sm font-medium text-gray-600">AI小劲 · 随时聊</p>
          <p className="text-xs text-gray-400 mt-0.5">语音对话，像朋友一样倾听</p>
        </motion.div>

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
