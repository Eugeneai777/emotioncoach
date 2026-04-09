/**
 * Video merger — calls server-side edge function for reliable MP4 concatenation.
 * Replaces the previous ffmpeg.wasm browser-side approach which was unreliable
 * due to 32MB wasm loading timeouts.
 */

import { supabase } from '@/integrations/supabase/client';

export async function mergeVideosClientSide(
  videoUrls: string[],
  onProgress?: (message: string) => void,
): Promise<Blob> {
  if (videoUrls.length === 0) throw new Error('没有视频片段');

  if (videoUrls.length === 1) {
    onProgress?.('仅一个片段，直接下载...');
    const resp = await fetch(videoUrls[0]);
    if (!resp.ok) throw new Error(`视频下载失败: HTTP ${resp.status}`);
    return resp.blob();
  }

  // Get user ID for the edge function
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('请先登录');

  onProgress?.(`正在服务端合并 ${videoUrls.length} 个视频片段...`);

  // Call server-side merge edge function
  const { data, error } = await supabase.functions.invoke('merge-videos', {
    body: {
      video_urls: videoUrls,
      user_id: user.id,
    },
  });

  if (error) {
    throw new Error(`视频合并服务调用失败: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(`视频合并失败: ${data.error}`);
  }

  if (!data?.video_url) {
    throw new Error('视频合并未返回结果 URL');
  }

  onProgress?.('合并完成，正在下载成片...');

  // Download the merged video
  const mergedResp = await fetch(data.video_url);
  if (!mergedResp.ok) {
    throw new Error(`合并视频下载失败: HTTP ${mergedResp.status}`);
  }

  const blob = await mergedResp.blob();
  onProgress?.(`合并完成，文件大小: ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
  return blob;
}
