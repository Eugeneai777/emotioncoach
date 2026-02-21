import { motion } from "framer-motion";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export function ShareInfoCard() {
  const [searchParams] = useSearchParams();

  const handleCopyLink = async () => {
    const ref = searchParams.get('ref') || localStorage.getItem('share_ref_code');
    const base = `${window.location.origin}/wealth-block`;
    const url = ref ? `${base}?ref=${ref}` : base;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制，快去分享给朋友吧 🎉");
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      onClick={handleCopyLink}
      className="cursor-pointer rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
        <Share2 className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">推荐给朋友</p>
        <p className="text-xs text-muted-foreground mt-0.5">发现你的财富卡点，开启觉醒之旅</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
        <Copy className="w-3.5 h-3.5" />
        <span>复制链接</span>
      </div>
    </motion.div>
  );
}
