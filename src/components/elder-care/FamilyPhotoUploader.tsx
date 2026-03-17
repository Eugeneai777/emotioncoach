import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, Share2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const MAX_PHOTOS = 50;

const compressImage = (file: File, maxSize = 1920, quality = 0.8): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = (height / width) * maxSize; width = maxSize; }
        else { width = (width / height) * maxSize; height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), file.type, quality);
    };
    img.onerror = () => reject(new Error("load failed"));
    img.src = URL.createObjectURL(file);
  });

export function FamilyPhotoUploader() {
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: photoCount = 0 } = useQuery({
    queryKey: ["family-photo-count", userId],
    queryFn: async () => {
      const { count } = await supabase
        .from("family_photos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const { data: shareToken, refetch: refetchToken } = useQuery({
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !userId) return;

    const remaining = MAX_PHOTOS - photoCount;
    if (remaining <= 0) {
      toast({ title: `最多保存${MAX_PHOTOS}张照片`, description: "请先删除旧照片", variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, Math.min(remaining, 9));
    setUploading(true);

    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) continue;

        let blob: File | Blob = file;
        if (file.size > 1024 * 1024) {
          try { blob = await compressImage(file); } catch { /* use original */ }
        }
        if (blob.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name} 太大了`, variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await supabase.storage.from("family-photos").upload(path, blob);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("family-photos").getPublicUrl(data.path);

        const { error: dbErr } = await supabase.from("family_photos").insert({ user_id: userId, photo_url: publicUrl });
        if (dbErr) throw dbErr;
      }

      queryClient.invalidateQueries({ queryKey: ["family-photo-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["family-photos"] });
      toast({ title: "照片已上传 📸", description: "长辈打开就能看到啦" });
    } catch (err) {
      console.error("上传失败:", err);
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleInvite = async () => {
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
        await refetchToken();
      } catch (err) {
        console.error(err);
        toast({ title: "生成链接失败", variant: "destructive" });
        setCreating(false);
        return;
      }
      setCreating(false);
    }

    const url = `${window.location.origin}/family-album/${token}`;

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
    <div className="mt-3 flex gap-2">
      <input
        type="file"
        id="family-photo-upload"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
      <label htmlFor="family-photo-upload" className="flex-1">
        <Button
          type="button"
          variant="outline"
          className="w-full border-emerald-200 text-emerald-700"
          disabled={uploading}
          asChild
        >
          <span className="cursor-pointer">
            {uploading ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />上传中...</>
            ) : (
              <><ImageIcon className="mr-1.5 h-4 w-4" />上传照片（{photoCount}/{MAX_PHOTOS}）</>
            )}
          </span>
        </Button>
      </label>
      <Button
        type="button"
        variant="outline"
        className="border-orange-200 text-orange-700 hover:bg-orange-50"
        disabled={creating}
        onClick={handleInvite}
      >
        {creating ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check className="mr-1.5 h-4 w-4" />
        ) : (
          <Share2 className="mr-1.5 h-4 w-4" />
        )}
        {copied ? "已复制" : "邀请亲友"}
      </Button>
    </div>
  );
}
