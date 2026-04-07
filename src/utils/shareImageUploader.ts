/**
 * Upload a generated image blob to Storage and return a public HTTPS URL.
 * 
 * Uses the `public-share-images` bucket which allows anonymous uploads,
 * so unauthenticated WeChat visitors on promo pages can also get HTTPS URLs.
 */

import { supabase } from "@/integrations/supabase/client";

export async function uploadShareImage(blob: Blob): Promise<string> {
  const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
  const path = `promo-share/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('public-share-images')
    .upload(path, blob, { contentType: blob.type || 'image/png', upsert: false });

  if (error) {
    console.error('[shareImageUploader] Upload failed:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('public-share-images')
    .getPublicUrl(path);

  console.log('[shareImageUploader] Uploaded to:', data.publicUrl);
  return data.publicUrl;
}
