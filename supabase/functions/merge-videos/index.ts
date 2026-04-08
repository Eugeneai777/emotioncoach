import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * merge-videos: 接收多个视频URL，按顺序下载并拼接后上传到Storage
 * 
 * 由于 Deno Deploy 无法运行 ffmpeg，这里采用"先下载所有MP4片段，
 * 再用 TS 重新封装"的方式。但最简单可靠的方案是：
 * 使用 ffmpeg concat protocol 通过临时文件拼接。
 * 
 * 实际方案：下载所有视频到内存，上传到 storage，返回所有 URL。
 * 真正的合并由前端 Remotion 处理，或在此直接返回片段列表。
 * 
 * 更新：使用简单的 binary concat 方式（对于相同编码参数的MP4片段，
 * 可以先转成 TS 再拼接，但这里简化为返回片段列表让前端处理）
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_urls, user_id } = await req.json();

    if (!video_urls || !Array.isArray(video_urls) || video_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "video_urls 为必填数组参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id 为必填参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 如果只有一个视频，直接返回
    if (video_urls.length === 1) {
      return new Response(
        JSON.stringify({ video_url: video_urls[0], segments: video_urls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 下载所有视频片段到内存
    console.log(`[merge-videos] Downloading ${video_urls.length} video segments...`);
    const videoBuffers: Uint8Array[] = [];

    for (let i = 0; i < video_urls.length; i++) {
      const url = video_urls[i];
      console.log(`[merge-videos] Downloading segment ${i + 1}/${video_urls.length}: ${url.slice(0, 80)}`);
      
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`下载视频片段 ${i + 1} 失败: HTTP ${resp.status}`);
      }
      
      const buffer = new Uint8Array(await resp.arrayBuffer());
      videoBuffers.push(buffer);
      console.log(`[merge-videos] Segment ${i + 1} size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // 简单的 binary concat — 对于即梦返回的 MP4 (同编码参数)
    // 注意：这种方式只适用于相同编码参数的MP4
    // 更可靠的方式是通过 TS (transport stream) 转封装再拼接
    // 但在 Deno Deploy 环境下没有 ffmpeg，所以我们直接拼接并上传
    const totalSize = videoBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of videoBuffers) {
      merged.set(buf, offset);
      offset += buf.length;
    }

    console.log(`[merge-videos] Total merged size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // 上传合并后的视频到 Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `merged/${user_id}/${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("video-assets")
      .upload(fileName, merged, { contentType: "video/mp4" });

    if (uploadError) {
      throw new Error(`合并视频上传失败: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("video-assets").getPublicUrl(fileName);

    console.log(`[merge-videos] Merged video uploaded: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        video_url: urlData.publicUrl, 
        segments: video_urls,
        segment_count: video_urls.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[merge-videos] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
