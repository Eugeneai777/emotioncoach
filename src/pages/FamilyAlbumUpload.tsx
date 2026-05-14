import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const MAX_UPLOAD = 9;

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

export default function FamilyAlbumUpload() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return; }
    supabase
      .rpc("resolve_family_album_share", { p_token: token })
      .then(({ data }: any) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.target_user_id) {
          setTargetUserId(row.target_user_id);
          setNickname(row.nickname);
        } else {
          setInvalid(true);
        }
        setLoading(false);
      });
  }, [token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !targetUserId || !token) return;

    const filesToUpload = Array.from(files).slice(0, MAX_UPLOAD);
    setUploading(true);
    let count = 0;

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
        const path = `${targetUserId}/guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await supabase.storage.from("family-photos").upload(path, blob);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("family-photos").getPublicUrl(data.path);

        const { error: dbErr } = await supabase.rpc("insert_family_photo_via_token", {
          p_token: token,
          p_photo_url: publicUrl,
          p_caption: null,
        });
        if (dbErr) throw dbErr;
        count++;
      }

      setUploadedCount(prev => prev + count);
      toast({ title: `成功上传 ${count} 张照片 📸`, description: "长辈打开就能看到啦" });
    } catch (err) {
      console.error("上传失败:", err);
      toast({ title: "上传失败，请重试", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 p-6 text-center">
        <span className="text-5xl mb-4">😔</span>
        <h1 className="text-xl font-bold text-orange-900 mb-2">链接已失效</h1>
        <p className="text-sm text-orange-600">请联系家人重新分享相册链接</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/30 to-white">
      <div className="max-w-lg mx-auto px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-5xl mb-4 block">📷</span>
          <h1 className="text-2xl font-bold text-orange-900 mb-2">
            给{nickname || "长辈"}上传照片
          </h1>
          <p className="text-sm text-orange-600/80">
            上传生活照片，让{nickname || "长辈"}随时看到你的近况
          </p>
        </motion.div>

        {uploadedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-800">
              已上传 {uploadedCount} 张照片
            </p>
            <p className="text-xs text-emerald-600/70 mt-1">
              {nickname || "长辈"}打开相册就能看到啦 💕
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            type="file"
            id="guest-photo-upload"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="guest-photo-upload">
            <Button
              type="button"
              className="w-full py-6 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl shadow-lg"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer flex items-center justify-center gap-2">
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />上传中...</>
                ) : (
                  <><ImageIcon className="h-5 w-5" />选择照片上传（最多{MAX_UPLOAD}张）</>
                )}
              </span>
            </Button>
          </label>

          <p className="text-center text-xs text-orange-400 mt-4">
            <Heart className="inline w-3 h-3 mr-1" />
            无需注册，直接上传
          </p>
        </motion.div>
      </div>
    </div>
  );
}
