/**
 * Video merger — calls server-side edge function for reliable MP4 concatenation.
 * Supports optional audio URLs for muxing narration into the final MP4.
 */

import { supabase } from '@/integrations/supabase/client';

export async function mergeVideosClientSide(
  videoUrls: string[],
  onProgress?: (message: string) => void,
  audioUrls?: (string | null)[],
): Promise<Blob> {
  if (videoUrls.length === 0) throw new Error('没有视频片段');

  if (videoUrls.length === 1 && (!audioUrls || !audioUrls[0])) {
    onProgress?.('仅一个片段，直接下载...');
    const resp = await fetch(videoUrls[0]);
    if (!resp.ok) throw new Error(`视频下载失败: HTTP ${resp.status}`);
    return resp.blob();
  }

  // Get user ID for the edge function
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('请先登录');

  const hasAudio = audioUrls && audioUrls.some(Boolean);
  onProgress?.(`正在服务端合并 ${videoUrls.length} 个视频片段${hasAudio ? '（含旁白音频）' : ''}...`);

  // Call server-side merge edge function
  const body: any = {
    video_urls: videoUrls,
    user_id: user.id,
  };
  if (hasAudio) {
    body.audio_urls = audioUrls;
  }

  const { data, error } = await supabase.functions.invoke('merge-videos', { body });

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
