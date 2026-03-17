import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getChildRef } from "@/utils/elderMoodUpload";
import { useAuth } from "@/hooks/useAuth";
import { X, ImageOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FamilyAlbumShareButton } from "./FamilyAlbumShareButton";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const PHOTOS_PER_PAGE = 20;

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

function isNew(created_at: string) {
  return Date.now() - new Date(created_at).getTime() < 24 * 60 * 60 * 1000;
}

function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate pseudo-random aspect ratio based on photo id for masonry effect
  const aspectClass = useMemo(() => {
    const hash = photo.id.charCodeAt(0) + photo.id.charCodeAt(photo.id.length - 1);
    const variants = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/3.5]"];
    return variants[hash % variants.length];
  }, [photo.id]);

  if (error) {
    return (
      <div className="rounded-2xl bg-orange-50 border border-orange-100/60 flex items-center justify-center aspect-square">
        <ImageOff className="w-6 h-6 text-orange-300" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-orange-100/60 
                 active:scale-[0.97] transition-transform duration-200 text-left"
    >
      <div className={`relative w-full ${aspectClass} overflow-hidden`}>
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-amber-50/40 to-orange-50/30 animate-pulse" />
        )}
        <img
          src={photo.photo_url}
          alt={photo.caption || "家人照片"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-400 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        {isNew(photo.created_at) && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow">
            新
          </span>
        )}
      </div>

      {/* Caption & time */}
      <div className="px-2.5 py-2">
        {photo.caption && (
          <p className="text-xs font-medium text-orange-900 line-clamp-2 mb-1">{photo.caption}</p>
        )}
        <p className="text-[10px] text-orange-400">
          {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true, locale: zhCN })}
        </p>
      </div>
    </motion.button>
  );
}

export function FamilyPhotoWaterfall() {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { session } = useAuth();

  const childRef = getChildRef();
  const childUserId = childRef?.startsWith("child_") ? childRef.slice(6) : null;
  const targetUserId = childUserId || session?.user?.id || null;

  const { data: photos = [] } = useQuery({
    queryKey: ["family-photos", targetUserId, page],
    queryFn: async () => {
      const { data } = await supabase
        .from("family_photos")
        .select("id, photo_url, caption, created_at")
        .eq("user_id", targetUserId!)
        .order("created_at", { ascending: false })
        .limit(page * PHOTOS_PER_PAGE);
      return (data ?? []) as Photo[];
    },
    enabled: !!targetUserId,
  });

  const hasMore = photos.length >= page * PHOTOS_PER_PAGE;

  // Split into two columns for masonry
  const { leftCol, rightCol } = useMemo(() => {
    const left: Photo[] = [];
    const right: Photo[] = [];
    photos.forEach((p, i) => (i % 2 === 0 ? left : right).push(p));
    return { leftCol: left, rightCol: right };
  }, [photos]);

  const handleView = useCallback((url: string) => setViewUrl(url), []);

  if (!targetUserId || !photos.length) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📷</span>
          <h3 className="text-sm font-semibold text-orange-900">家人相册</h3>
          <div className="ml-auto flex items-center gap-2">
            <FamilyAlbumShareButton />
            <span className="text-[10px] text-orange-400">{photos.length} 张</span>
          </div>
        </div>

        {/* Masonry grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            {leftCol.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onClick={() => handleView(photo.photo_url)} />
            ))}
          </div>
          <div className="space-y-3">
            {rightCol.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onClick={() => handleView(photo.photo_url)} />
            ))}
          </div>
        </div>

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full mt-4 py-2.5 text-sm text-orange-500 font-medium rounded-xl 
                       border border-orange-200/60 bg-orange-50/50 
                       active:scale-[0.98] transition-transform"
          >
            加载更多照片
          </button>
        )}
      </motion.div>

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {viewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setViewUrl(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white"
              onClick={() => setViewUrl(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={viewUrl}
              alt="查看照片"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
