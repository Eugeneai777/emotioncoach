import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import MP4Box from "https://esm.sh/mp4box@0.5.2";

/**
 * merge-videos: 使用 mp4box.js 在服务端对同编码参数的 MP4 片段进行无损合并
 * 流程：下载 → 解析提取 samples → 重新封装 → 上传 → 返回 URL
 */

interface SampleInfo {
  data: ArrayBuffer;
  duration: number;
  is_sync: boolean;
  cts: number;
  dts: number;
}

interface TrackInfo {
  id: number;
  trackType: string; // 'video' | 'audio'
  codec: string;
  timescale: number;
  samples: SampleInfo[];
  // Video-specific
  width?: number;
  height?: number;
  // Audio-specific
  sampleRate?: number;
  channelCount?: number;
  sampleSize?: number;
  // Codec description boxes (avcC, esds, etc.)
  descriptionBoxes: any[];
}

/**
 * Parse an MP4 buffer and extract track info + all samples
 */
function parseMP4(buffer: ArrayBuffer): Promise<TrackInfo[]> {
  return new Promise((resolve, reject) => {
    const file = MP4Box.createFile();
    const tracks: TrackInfo[] = [];
    const samplesMap = new Map<number, SampleInfo[]>();
    let ready = false;

    file.onReady = (info: any) => {
      ready = true;
      for (const t of info.tracks) {
        samplesMap.set(t.id, []);

        // Extract codec description boxes from the sample description entry
        const descBoxes: any[] = [];
        try {
          const trakBox = file.moov.traks.find(
            (tr: any) => tr.tkhd.track_id === t.id
          );
          const entry = trakBox?.mdia?.minf?.stbl?.stsd?.entries?.[0];
          if (entry) {
            // Collect known codec config boxes
            for (const key of ['avcC', 'hvcC', 'vpcC', 'av1C', 'esds', 'dOps', 'fLaC', 'dfLa', 'btrt', 'pasp', 'colr', 'clap']) {
              if (entry[key]) descBoxes.push(entry[key]);
            }
          }
        } catch (e) {
          console.warn(`[merge] Could not extract description boxes for track ${t.id}:`, e);
        }

        tracks.push({
          id: t.id,
          trackType: t.type === 'video' ? 'video' : 'audio',
          codec: t.codec,
          timescale: t.timescale,
          width: t.video?.width,
          height: t.video?.height,
          sampleRate: t.audio?.sample_rate,
          channelCount: t.audio?.channel_count,
          sampleSize: t.audio?.sample_size || 16,
          samples: [],
          descriptionBoxes: descBoxes,
        });

        file.setExtractionOptions(t.id, null, { nbSamples: 500000 });
      }
      file.start();
    };

    file.onSamples = (trackId: number, _user: any, samples: any[]) => {
      const arr = samplesMap.get(trackId);
      if (!arr) return;
      for (const s of samples) {
        // s.data is a Uint8Array view; slice out a copy of the underlying buffer
        const dataCopy = s.data.buffer.slice(
          s.data.byteOffset,
          s.data.byteOffset + s.data.byteLength
        );
        arr.push({
          data: dataCopy,
          duration: s.duration,
          is_sync: s.is_sync,
          cts: s.cts,
          dts: s.dts,
        });
      }
    };

    file.onError = (e: any) => reject(new Error(`MP4 parse error: ${e}`));

    try {
      const buf = buffer.slice(0); // clone so fileStart can be set
      (buf as any).fileStart = 0;
      file.appendBuffer(buf);
      file.flush();
    } catch (e) {
      return reject(new Error(`appendBuffer failed: ${e}`));
    }

    // mp4box extraction is synchronous after appendBuffer+start+flush
    // but give a small safety margin
    if (ready) {
      for (const track of tracks) {
        track.samples = samplesMap.get(track.id) || [];
      }
      resolve(tracks);
    } else {
      // Fallback: wait briefly for async processing
      setTimeout(() => {
        for (const track of tracks) {
          track.samples = samplesMap.get(track.id) || [];
        }
        if (tracks.length === 0) {
          reject(new Error('MP4 parsing produced no tracks'));
        } else {
          resolve(tracks);
        }
      }, 1000);
    }
  });
}

/**
 * Merge parsed segments into a single MP4 using mp4box.js muxing
 */
function createMergedMP4(allSegments: TrackInfo[][]): ArrayBuffer {
  const outFile = MP4Box.createFile();
  const firstSeg = allSegments[0];
  const trackIdMap = new Map<number, number>();

  // Create tracks based on first segment's track layout
  for (const track of firstSeg) {
    const codecBase = track.codec.split('.')[0]; // e.g. 'avc1', 'mp4a'

    const opts: any = {
      timescale: track.timescale,
      type: codecBase,
      hdlr: track.trackType === 'video' ? 'vide' : 'soun',
    };

    if (track.trackType === 'video') {
      opts.width = track.width || 720;
      opts.height = track.height || 1280;
    } else {
      opts.samplerate = track.sampleRate || 44100;
      opts.channel_count = track.channelCount || 2;
      opts.samplesize = track.sampleSize || 16;
    }

    // Pass codec description boxes (avcC, esds, etc.)
    if (track.descriptionBoxes.length > 0) {
      opts.description_boxes = track.descriptionBoxes;
    }

    const newId = outFile.addTrack(opts);
    trackIdMap.set(track.id, newId);
    console.log(`[merge] Created track ${newId}: ${codecBase} (${track.trackType})`);
  }

  // Add all samples from all segments
  let totalSamples = 0;
  for (const segTracks of allSegments) {
    for (const track of segTracks) {
      const newTrackId = trackIdMap.get(track.id);
      if (newTrackId === undefined) {
        // Try matching by type if IDs differ across segments
        const matchByType = firstSeg.find(t => t.trackType === track.trackType);
        if (!matchByType) continue;
        const fallbackId = trackIdMap.get(matchByType.id);
        if (fallbackId === undefined) continue;

        for (const sample of track.samples) {
          outFile.addSample(fallbackId, new Uint8Array(sample.data), {
            duration: sample.duration,
            is_sync: sample.is_sync,
            cts_offset: sample.cts - sample.dts,
          });
          totalSamples++;
        }
      } else {
        for (const sample of track.samples) {
          outFile.addSample(newTrackId, new Uint8Array(sample.data), {
            duration: sample.duration,
            is_sync: sample.is_sync,
            cts_offset: sample.cts - sample.dts,
          });
          totalSamples++;
        }
      }
    }
  }

  console.log(`[merge] Total samples added: ${totalSamples}`);

  // Write to buffer
  const stream = new MP4Box.DataStream();
  stream.endianness = MP4Box.DataStream.BIG_ENDIAN;
  outFile.write(stream);

  return stream.buffer;
}

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

    // Single video — return directly
    if (video_urls.length === 1) {
      return new Response(
        JSON.stringify({ video_url: video_urls[0], segments: video_urls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Safety: limit segment count and total size
    if (video_urls.length > 10) {
      return new Response(
        JSON.stringify({ error: "最多支持合并 10 个片段" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download all segments
    console.log(`[merge] Downloading ${video_urls.length} segments...`);
    const buffers: ArrayBuffer[] = [];
    let totalBytes = 0;

    for (let i = 0; i < video_urls.length; i++) {
      const resp = await fetch(video_urls[i]);
      if (!resp.ok) {
        throw new Error(`片段 ${i + 1} 下载失败: HTTP ${resp.status}`);
      }
      const buf = await resp.arrayBuffer();
      totalBytes += buf.byteLength;
      buffers.push(buf);
      console.log(`[merge] Segment ${i + 1}: ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB`);

      // Memory guard: 100MB total download limit
      if (totalBytes > 100 * 1024 * 1024) {
        throw new Error("视频总大小超过 100MB 限制");
      }
    }

    // Parse all segments
    console.log(`[merge] Parsing ${buffers.length} segments with mp4box.js...`);
    const allSegments: TrackInfo[][] = [];
    for (let i = 0; i < buffers.length; i++) {
      const tracks = await parseMP4(buffers[i]);
      console.log(`[merge] Segment ${i + 1}: ${tracks.length} tracks, samples: ${tracks.map(t => t.samples.length).join('/')}`);
      
      if (tracks.some(t => t.samples.length === 0)) {
        console.warn(`[merge] Segment ${i + 1} has tracks with 0 samples, may produce incomplete output`);
      }
      allSegments.push(tracks);
    }

    // Create merged MP4
    console.log(`[merge] Creating merged MP4...`);
    const mergedBuffer = createMergedMP4(allSegments);
    const mergedSize = mergedBuffer.byteLength;
    console.log(`[merge] Merged size: ${(mergedSize / 1024 / 1024).toFixed(1)} MB`);

    if (mergedSize < 1000) {
      throw new Error("合并结果异常（文件过小），可能编码不兼容");
    }

    // Upload to storage
    console.log(`[merge] Uploading merged video...`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `merged/${user_id}/${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("video-assets")
      .upload(fileName, new Uint8Array(mergedBuffer), { contentType: "video/mp4" });

    if (uploadError) {
      throw new Error(`合并视频上传失败: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("video-assets").getPublicUrl(fileName);
    console.log(`[merge] Success: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        video_url: urlData.publicUrl,
        segments: video_urls,
        segment_count: video_urls.length,
        merged_size_mb: (mergedSize / 1024 / 1024).toFixed(1),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[merge] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
