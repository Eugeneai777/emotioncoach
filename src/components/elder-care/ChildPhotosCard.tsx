import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getChildRef } from "@/utils/elderMoodUpload";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ChildPhotosCard() {
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const childRef = getChildRef();
  // childRef format: "child_<uuid>" — extract the uuid
  const childUserId = childRef?.startsWith("child_") ? childRef.slice(6) : null;

  const { data: photos } = useQuery({
    queryKey: ["family-photos", childUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("family_photos")
        .select("id, photo_url, caption, created_at")
        .eq("user_id", childUserId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!childUserId,
  });

  if (!childUserId || !photos?.length) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="pb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📷</span>
          <h3 className="text-sm font-semibold text-orange-900">家人相册</h3>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setViewUrl(photo.photo_url)}
              className="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden shadow-sm border border-orange-100/60 
                         active:scale-95 transition-transform duration-200"
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || "家人照片"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
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
