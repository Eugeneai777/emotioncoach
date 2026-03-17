import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Loader2, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function FamilyAlbumShareButton() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const userId = session?.user?.id;

  const { data: shareToken, refetch } = useQuery({
    queryKey: ["family-album-share", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("family_album_shares" as any)
        .select("share_token")
        .eq("user_id", userId!)
        .eq("is_active", true)
        .maybeSingle() as any;
      return (data?.share_token as string) ?? null;
    },
    enabled: !!userId,
  });

  const getShareUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/family-album/${token}`;
  };

  const handleShare = async () => {
    if (!userId) return;

    let token = shareToken;

    if (!token) {
      setCreating(true);
      try {
        const { data, error } = await supabase
          .from("family_album_shares" as any)
          .insert({ user_id: userId, nickname: "长辈" })
          .select("share_token")
          .single() as any;
        if (error) throw error;
        token = data.share_token as string;
        await refetch();
      } catch (err) {
        console.error(err);
        toast({ title: "生成链接失败", variant: "destructive" });
        setCreating(false);
        return;
      }
      setCreating(false);
    }

    const url = getShareUrl(token!);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "一起给长辈上传照片",
          text: "打开链接，上传照片给长辈看 📷",
          url,
        });
        return;
      } catch { /* fallback to copy */ }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "链接已复制 📋", description: "分享给亲友即可一起上传照片" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "请手动复制链接", description: url });
    }
  };

  if (!userId) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={creating}
      className="border-orange-200 text-orange-700 hover:bg-orange-50"
    >
      {creating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : copied ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Share2 className="h-4 w-4 mr-1" />
      )}
      {copied ? "已复制" : "邀请亲友上传"}
    </Button>
  );
}
