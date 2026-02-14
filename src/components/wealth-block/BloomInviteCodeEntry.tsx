import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BloomInviteCodeEntryProps {
  /** Called after successful claim */
  onSuccess?: () => void;
  /** Visual style variant */
  variant?: "card" | "inline";
}

export function BloomInviteCodeEntry({ onSuccess, variant = "card" }: BloomInviteCodeEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!inviteCode.trim() || isClaiming) return;
    setIsClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-partner-invitation", {
        body: { invite_code: inviteCode.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.success) {
        toast.success(data.message || "邀请码领取成功！权益已发放 🎉");
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error(err?.message || "领取失败，请重试");
    } finally {
      setIsClaiming(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className="text-center">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Gift className="w-3.5 h-3.5" />
            我有绽放邀请码
          </button>
        ) : (
          <div className="flex gap-2 max-w-xs mx-auto">
            <Input
              placeholder="BLOOM-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="h-9 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={!inviteCode.trim() || isClaiming}
              className="h-9 px-4 whitespace-nowrap"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "领取"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Card variant - more prominent
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-rose-200 dark:border-rose-800/40 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 overflow-hidden"
    >
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">我有绽放合伙人邀请码</p>
              <p className="text-[11px] text-muted-foreground">输入邀请码免费解锁全部权益</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-rose-400" />
        </button>
      ) : (
        <div className="p-3 sm:p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-medium">输入绽放邀请码</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="BLOOM-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="h-10 text-sm"
              autoFocus
            />
            <Button
              onClick={handleClaim}
              disabled={!inviteCode.trim() || isClaiming}
              className="h-10 px-5 whitespace-nowrap bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "立即领取"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            领取后将自动解锁测评及训练营权益
          </p>
        </div>
      )}
    </motion.div>
  );
}
