import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, ChevronRight, Flame, Sparkles, Home, Share2 } from "lucide-react";
import { LazyIntroShareDialog } from "@/components/common/LazyIntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { parseAndStoreParentRef } from "@/utils/xiaojinMoodUpload";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";

const entries = [
  { emoji: "🙂", label: "今天心情", desc: "3分钟情绪探索", path: "/xiaojin/mood", gradient: "from-amber-400 to-orange-400", bg: "bg-amber-50" },
  { emoji: "🧠", label: "我的天赋", desc: "发现隐藏超能力", path: "/xiaojin/talent", gradient: "from-sky-400 to-blue-500", bg: "bg-sky-50" },
  { emoji: "🚀", label: "未来方向", desc: "AI帮你看未来", path: "/xiaojin/future", gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50" },
];

export default function XiaojinHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const isFromParent = fromParam === "parent" || (fromParam?.startsWith("parent_") ?? false);
  const { remaining, canAfford } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Parse and store parent reference for mood upload
  useEffect(() => {
    if (fromParam) {
      parseAndStoreParentRef(fromParam);
    }
  }, [fromParam]);

  const handleVoiceClick = () => {
    if (!canAfford(8)) {
      setShowUpgrade(true);
      return;
    }
    navigate("/xiaojin/voice");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white pb-20">
      <div className="max-w-md mx-auto px-5 pt-4 pb-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { sessionStorage.setItem('skip_preferred_redirect', '1'); navigate("/mini-app"); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>主页</span>
          </motion.button>

          <LazyIntroShareDialog
            config={introShareConfigs.xiaojin}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给孩子</span>
              </motion.button>
            }
          />
        </div>

        {/* 孩子端欢迎横幅 + 剩余点数 */}
        {isFromParent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl p-4 border border-amber-200/60"
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fff7ed)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">👋</span>
              <span className="text-sm font-bold text-amber-800">嘿，欢迎来到小劲AI！</span>
            </div>
            <p className="text-xs text-amber-600/80 leading-relaxed">
              爸妈把这个分享给你啦～试试下面的功能，探索你的情绪和天赋吧 ✨
            </p>
          </motion.div>
        )}


        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-1"
        >
          <div className="inline-flex items-center gap-1.5 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-[22px] font-extrabold tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              小劲AI
            </span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[11px] text-gray-400 tracking-widest font-medium">与 光 同 行</p>
        </motion.div>

        {/* Voice CTA — Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center py-10"
        >
          <button
            onClick={handleVoiceClick}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="开始AI小劲语音对话"
          >
            {/* Soft glow */}
            <motion.div
              className="absolute rounded-full blur-2xl bg-gradient-to-r from-orange-300/25 to-amber-300/25"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '160px', height: '160px', top: '-20px', left: '-20px' }}
            />

            {/* Pulsing ring */}
            <motion.div
              className="absolute rounded-full border-[1.5px] border-orange-300/60"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              style={{ width: '120px', height: '120px', top: 0, left: 0 }}
            />

            {/* Main circle */}
            <motion.div
              className="relative w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              style={{
                background: 'linear-gradient(135deg, #fb923c 0%, #f59e0b 50%, #f97316 100%)',
                boxShadow: '0 12px 36px -8px rgba(249, 115, 22, 0.45), 0 0 0 4px rgba(251, 191, 36, 0.12)',
              }}
            >
              <div className="p-2.5 bg-white/20 rounded-full backdrop-blur-sm mb-1.5">
                <Phone className="h-7 w-7 text-white drop-shadow" />
              </div>
              <span className="text-[13px] font-bold text-white drop-shadow-sm tracking-wide">随时聊</span>
            </motion.div>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-5"
          >
            <p className="text-[11px] text-gray-400 mt-1">语音对话，像朋友一样倾听你 💛</p>
            <p className="text-[10px] text-gray-300 mt-0.5">每分钟消耗 8 点</p>
          </motion.div>
        </motion.div>

        {/* Entry Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {entries.map((item, i) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={() => navigate(item.path)}
              className={`${item.bg} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-[0.96] transition-all shadow-sm hover:shadow-md border border-white/60`}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
              <span className="text-[10px] text-gray-400 leading-tight text-center">{item.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* Challenge CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/xiaojin/challenge")}
          className="w-full rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl border border-orange-200/40"
          style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #f59e0b 60%, #fbbf24 100%)',
          }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <div className="text-[15px] font-bold text-white">成长100天挑战</div>
            <div className="text-[11px] text-white/80 mt-0.5">每天一个问题，遇见更好的自己</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
        </motion.button>

        {/* Social Proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-[11px] text-gray-300 mt-8"
        >
          已有 30,000+ 青少年参与成长挑战
        </motion.p>

        {/* 设为默认首页 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-4 mt-6"
        >
          <button
            onClick={() => {
              localStorage.setItem('preferred_audience', 'youth');
              const el = document.getElementById('set-home-toast-youth');
              if (el) { el.textContent = '✅ 已设为默认首页'; setTimeout(() => { el.textContent = '⭐ 设为我的首页'; }, 2000); }
            }}
            className="w-full text-center py-2.5 rounded-xl border border-amber-200/60 bg-amber-50/50 text-sm text-amber-600 active:scale-[0.98] transition-transform"
          >
            <span id="set-home-toast-youth">⭐ 设为我的首页</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center mt-5 pb-4"
        >
          <p className="text-[10px] text-gray-300 tracking-wider">有劲AI · 让你天天都有劲</p>
        </motion.div>
      </div>

      {/* 365套餐升级弹窗 */}
      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        defaultPackage="member365"
        triggerFeature="免费体验点数已用完"
        onSuccess={() => setShowUpgrade(false)}
      />

      <AwakeningBottomNav />
    </div>
  );
}
