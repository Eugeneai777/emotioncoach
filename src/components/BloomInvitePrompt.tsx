import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Global component: after login, checks if there are pending Bloom partner
 * invitations and prompts the user to enter their invite code.
 * 
 * Shows at most once per session per user.
 */
export function BloomInvitePrompt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;

    const sessionKey = `bloom_invite_prompt_checked_${user.id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');

    // Small delay to let auto-claim finish first
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-pending-bloom-invite');
        if (data?.hasPending) {
          setOpen(true);
        }
      } catch {
        // Silently fail
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleClaim = useCallback(async () => {
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
        queryClient.invalidateQueries({ queryKey: ['assessment-purchase'] });
        queryClient.invalidateQueries({ queryKey: ['camp-purchase'] });
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "领取失败，请重试");
    } finally {
      setIsClaiming(false);
    }
  }, [inviteCode, isClaiming, queryClient]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader className="text-center space-y-3 pt-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-lg font-bold">
            您可能有绽放合伙人邀请
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            如果您收到了绽放合伙人的邀请码（BLOOM-XXXX），请在下方输入以领取全部权益
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Benefits preview */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 space-y-1.5">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 绽放权益包含
            </p>
            <ul className="text-[11px] text-rose-600 dark:text-rose-400 space-y-0.5 ml-4 list-disc">
              <li>财富卡点测评（免费）</li>
              <li>7天财富突破训练营（免费）</li>
              <li>绽放合伙人身份</li>
            </ul>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="BLOOM-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="h-11 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleClaim()}
            />
            <Button
              onClick={handleClaim}
              disabled={!inviteCode.trim() || isClaiming}
              className="h-11 px-5 whitespace-nowrap bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "领取"}
            </Button>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            我没有邀请码，跳过
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
