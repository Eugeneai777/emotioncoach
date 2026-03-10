/**
 * Upload a generated image blob to Storage and return a public HTTPS URL.
 * 
 * WeChat on Android cannot long-press-save `blob:` URLs — only `https://` works.
 * This utility bridges the gap by persisting the blob to the `partner-assets` bucket.
 */

import { supabase } from "@/integrations/supabase/client";

export async function uploadShareImage(blob: Blob): Promise<string> {
  const path = `temp-share/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

  const { error } = await supabase.storage
    .from('partner-assets')
    .upload(path, blob, { contentType: 'image/png', upsert: false });

  if (error) {
    console.error('[shareImageUploader] Upload failed:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('partner-assets')
    .getPublicUrl(path);

  console.log('[shareImageUploader] Uploaded to:', data.publicUrl);
  return data.publicUrl;
}
