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
      <div className="flex gap-2 max-w-xs mx-auto">
        <Input
          placeholder="请输入邀请码"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="h-9 text-sm"
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
    );
  }

  // Card variant - direct display
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-800/40 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 p-3 sm:p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-rose-500" />
        <p className="text-sm font-medium">我有邀请码</p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="请输入邀请码"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="h-10 text-sm"
        />
        <Button
          onClick={handleClaim}
          disabled={!inviteCode.trim() || isClaiming}
          className="h-10 px-5 whitespace-nowrap bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
        >
          {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "领取"}
        </Button>
      </div>
    </div>
  );
}
