import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Sun, Bell, Smile, Share2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";

const ElderCarePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/elder-care`;
    const refCode = localStorage.getItem("share_ref_code");
    const url = refCode ? `${shareUrl}?ref=${refCode}` : shareUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "大劲AI — 给爸妈一个更安心的陪伴入口",
          text: "会聊天、会问候、会提醒、会关怀，简单到长辈一看就懂",
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "链接已复制 ✅", description: "发送给家人即可" });
    }
  };

  const quickEntries = [
    { emoji: "☀️", title: "问候", desc: "每日暖心", route: "/elder-care/greeting" },
    { emoji: "🔔", title: "提醒", desc: "吃药喝水", route: "/elder-care/reminders" },
    { emoji: "😊", title: "心情", desc: "记录今天", route: "/elder-care/mood" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white">
      <PageHeader
        title="大劲AI"
        showBack
        rightActions={
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 active:scale-95 transition-transform"
          >
            <Share2 className="w-3.5 h-3.5" />
            分享给家人
          </button>
        }
      />

      {/* 品牌区 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-6 pb-2"
      >
        <span className="text-4xl block mb-2">🌿</span>
        <h2 className="text-xl font-bold text-orange-900">有劲陪长辈</h2>
        <p className="text-sm text-orange-600/70 mt-1">让陪伴更简单更温暖</p>
      </motion.div>

      {/* 中心大圆按钮 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col items-center py-8"
      >
        <button
          onClick={() => navigate("/elder-care/chat")}
          className="relative group focus:outline-none"
          aria-label="开始聊天"
        >
          {/* 外圈呼吸动画 */}
          <div className="absolute inset-[-16px] bg-gradient-to-r from-orange-300 to-amber-300 rounded-full animate-pulse opacity-30" />
          <div
            className="absolute inset-[-8px] bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-ping opacity-20"
            style={{ animationDuration: "2s" }}
          />

          {/* 主按钮 */}
          <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 
                          rounded-full flex flex-col items-center justify-center 
                          shadow-2xl shadow-orange-400/40 
                          hover:scale-105 active:scale-95 
                          transition-all duration-200 ease-out">
            <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-lg">陪我聊聊</span>
          </div>
        </button>

        <p className="mt-6 text-sm text-muted-foreground">
          像有人在身边陪着你 🌿
        </p>
      </motion.div>

      {/* 3列功能入口 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="px-5 pb-6"
      >
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {quickEntries.map((entry) => (
            <button
              key={entry.title}
              onClick={() => navigate(entry.route)}
              className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white shadow-sm 
                         border border-orange-100/60 
                         active:scale-95 transition-all duration-200"
            >
              <span className="text-2xl">{entry.emoji}</span>
              <span className="text-sm font-semibold text-orange-900">{entry.title}</span>
              <span className="text-[11px] text-orange-600/60">{entry.desc}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 平安打卡 CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="px-5 pb-8"
      >
        <button
          onClick={() => navigate("/alive-check")}
          className="w-full max-w-md mx-auto flex items-center justify-between 
                     px-5 py-4 rounded-2xl 
                     bg-gradient-to-r from-emerald-50 to-teal-50 
                     border border-emerald-200/60 
                     active:scale-[0.98] transition-transform duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-emerald-800">每日平安打卡</p>
              <p className="text-[11px] text-emerald-600/70">轻点一下，让家人放心</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400" />
        </button>
      </motion.div>

      {/* Footer */}
      <div className="text-center pb-10">
        <p className="text-xs text-muted-foreground/50">有劲AI · 让陪伴更简单</p>
      </div>
    </div>
  );
};

export default ElderCarePage;
