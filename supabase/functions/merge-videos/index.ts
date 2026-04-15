import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import MP4Box from "https://esm.sh/mp4box@0.5.2";

/**
 * merge-videos: 使用 mp4box.js 在服务端对同编码参数的 MP4 片段进行无损合并
 * 支持可选的 audio_urls 参数，将 MP3 音频作为音轨写入合并后的 MP4
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
  trackType: string;
  codec: string;
  timescale: number;
  samples: SampleInfo[];
  width?: number;
  height?: number;
  sampleRate?: number;
  channelCount?: number;
  sampleSize?: number;
  descriptionBoxes: any[];
}

// --- MP3 Frame Parser ---

const MP3_BITRATES: Record<string, number[]> = {
  'V1L3': [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],
  'V1L2': [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],
  'V1L1': [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0],
  'V2L3': [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
  'V2L2': [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
  'V2L1': [0,32,48,56,64,80,96,112,128,144,160,176,192,224,256,0],
};

const MP3_SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000, 0], // MPEG1
  2: [22050, 24000, 16000, 0], // MPEG2
  0: [11025, 12000, 8000, 0],  // MPEG2.5
};

interface MP3Frame {
  data: Uint8Array;
  samples: number; // samples per frame (1152 for layer 3 MPEG1, 576 for MPEG2/2.5)
  sampleRate: number;
  channels: number;
  bitrate: number;
}

function parseMP3Frames(buf: Uint8Array): MP3Frame[] {
  const frames: MP3Frame[] = [];
  let i = 0;

  // Skip ID3v2 tag if present
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) |
                 ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    i = 10 + size;
  }

  while (i < buf.length - 4) {
    // Find sync word: 11 bits set
    if (buf[i] !== 0xFF || (buf[i + 1] & 0xE0) !== 0xE0) {
      i++;
      continue;
    }

    const b1 = buf[i + 1];
    const b2 = buf[i + 2];

    const versionBits = (b1 >> 3) & 0x03;
    const layerBits = (b1 >> 1) & 0x03;
    const bitrateIdx = (b2 >> 4) & 0x0F;
    const srIdx = (b2 >> 2) & 0x03;
    const padding = (b2 >> 1) & 0x01;
    const channelMode = (buf[i + 3] >> 6) & 0x03;

    if (versionBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || srIdx === 3) {
      i++;
      continue;
    }

    const isV1 = versionBits === 3;
    const layer = 4 - layerBits; // layerBits: 3=L1, 2=L2, 1=L3

    const vKey = isV1 ? 'V1' : 'V2';
    const lKey = `L${layer}`;
    const brArr = MP3_BITRATES[`${vKey}${lKey}`];
    if (!brArr) { i++; continue; }

    const bitrate = brArr[bitrateIdx] * 1000;
    const sampleRate = MP3_SAMPLE_RATES[versionBits]?.[srIdx];
    if (!bitrate || !sampleRate) { i++; continue; }

    let frameLen: number;
    if (layer === 1) {
      frameLen = Math.floor((12 * bitrate / sampleRate + padding) * 4);
    } else {
      const slotSize = layer === 3 && !isV1 ? 72 : 144;
      frameLen = Math.floor(slotSize * bitrate / sampleRate + padding);
    }

    if (frameLen < 4 || i + frameLen > buf.length) break;

    const samplesPerFrame = (layer === 3 && !isV1) ? 576 : (layer === 1 ? 384 : 1152);

    frames.push({
      data: buf.slice(i, i + frameLen),
      samples: samplesPerFrame,
      sampleRate,
      channels: channelMode === 3 ? 1 : 2,
      bitrate,
    });

    i += frameLen;
  }

  return frames;
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

        const descBoxes: any[] = [];
        try {
          const trakBox = file.moov.traks.find((tr: any) => tr.tkhd.track_id === t.id);
          const entry = trakBox?.mdia?.minf?.stbl?.stsd?.entries?.[0];
          if (entry) {
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
        const dataCopy = s.data.buffer.slice(s.data.byteOffset, s.data.byteOffset + s.data.byteLength);
        arr.push({ data: dataCopy, duration: s.duration, is_sync: s.is_sync, cts: s.cts, dts: s.dts });
      }
    };

    file.onError = (e: any) => reject(new Error(`MP4 parse error: ${e}`));

    try {
      const buf = buffer.slice(0);
      (buf as any).fileStart = 0;
      file.appendBuffer(buf);
      file.flush();
    } catch (e) {
      return reject(new Error(`appendBuffer failed: ${e}`));
    }

    if (ready) {
      for (const track of tracks) track.samples = samplesMap.get(track.id) || [];
      resolve(tracks);
    } else {
      setTimeout(() => {
        for (const track of tracks) track.samples = samplesMap.get(track.id) || [];
        if (tracks.length === 0) reject(new Error('MP4 parsing produced no tracks'));
        else resolve(tracks);
      }, 1000);
    }
  });
}

/**
 * Merge parsed segments into a single MP4 using mp4box.js muxing
 */
function createMergedMP4(allSegments: TrackInfo[][], audioFrames?: MP3Frame[]): ArrayBuffer {
  const outFile = MP4Box.createFile();
  const firstSeg = allSegments[0];
  const trackIdMap = new Map<number, number>();

  // Create tracks based on first segment's track layout
  for (const track of firstSeg) {
    const codecBase = track.codec.split('.')[0];
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

    if (track.descriptionBoxes.length > 0) {
      opts.description_boxes = track.descriptionBoxes;
    }

    const newId = outFile.addTrack(opts);
    trackIdMap.set(track.id, newId);
    console.log(`[merge] Created track ${newId}: ${codecBase} (${track.trackType})`);
  }

  // Add MP3 audio track if we have audio frames
  let audioTrackId: number | null = null;
  if (audioFrames && audioFrames.length > 0) {
    const firstFrame = audioFrames[0];
    const audioOpts: any = {
      timescale: firstFrame.sampleRate,
      type: '.mp3',
      hdlr: 'soun',
      samplerate: firstFrame.sampleRate,
      channel_count: firstFrame.channels,
      samplesize: 16,
    };
    audioTrackId = outFile.addTrack(audioOpts);
    console.log(`[merge] Created MP3 audio track ${audioTrackId}: sr=${firstFrame.sampleRate} ch=${firstFrame.channels}`);
  }

  // Add all video samples from all segments
  let totalSamples = 0;
  for (const segTracks of allSegments) {
    for (const track of segTracks) {
      const newTrackId = trackIdMap.get(track.id);
      if (newTrackId === undefined) {
        const matchByType = firstSeg.find(t => t.trackType === track.trackType);
        if (!matchByType) continue;
        const fallbackId = trackIdMap.get(matchByType.id);
        if (fallbackId === undefined) continue;

        for (const sample of track.samples) {
          outFile.addSample(fallbackId, new Uint8Array(sample.data), {
            duration: sample.duration, is_sync: sample.is_sync, cts_offset: sample.cts - sample.dts,
          });
          totalSamples++;
        }
      } else {
        for (const sample of track.samples) {
          outFile.addSample(newTrackId, new Uint8Array(sample.data), {
            duration: sample.duration, is_sync: sample.is_sync, cts_offset: sample.cts - sample.dts,
          });
          totalSamples++;
        }
      }
    }
  }

  // Add MP3 audio samples
  if (audioTrackId !== null && audioFrames) {
    for (const frame of audioFrames) {
      outFile.addSample(audioTrackId, frame.data, {
        duration: frame.samples, // in timescale units (= sampleRate)
        is_sync: true,
      });
      totalSamples++;
    }
    console.log(`[merge] Added ${audioFrames.length} MP3 frames to audio track`);
  }

  console.log(`[merge] Total samples added: ${totalSamples}`);

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
    const { video_urls, user_id, audio_urls } = await req.json();

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

    // Single video without audio — return directly
    if (video_urls.length === 1 && (!audio_urls || !audio_urls[0])) {
      return new Response(
        JSON.stringify({ video_url: video_urls[0], segments: video_urls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (video_urls.length > 10) {
      return new Response(
        JSON.stringify({ error: "最多支持合并 10 个片段" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download all video segments
    console.log(`[merge] Downloading ${video_urls.length} video segments...`);
    const buffers: ArrayBuffer[] = [];
    let totalBytes = 0;

    for (let i = 0; i < video_urls.length; i++) {
      const resp = await fetch(video_urls[i]);
      if (!resp.ok) throw new Error(`片段 ${i + 1} 下载失败: HTTP ${resp.status}`);
      const buf = await resp.arrayBuffer();
      totalBytes += buf.byteLength;
      buffers.push(buf);
      console.log(`[merge] Video segment ${i + 1}: ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB`);
      if (totalBytes > 100 * 1024 * 1024) throw new Error("视频总大小超过 100MB 限制");
    }

    // Download audio files if provided
    let allAudioFrames: MP3Frame[] | undefined;
    if (audio_urls && Array.isArray(audio_urls) && audio_urls.some((u: string | null) => !!u)) {
      console.log(`[merge] Downloading audio files...`);
      const audioBuffers: Uint8Array[] = [];
      for (let i = 0; i < audio_urls.length; i++) {
        const url = audio_urls[i];
        if (!url) {
          console.log(`[merge] Audio ${i + 1}: (none)`);
          continue;
        }
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn(`[merge] Audio ${i + 1} download failed: HTTP ${resp.status}, skipping`);
          continue;
        }
        const buf = new Uint8Array(await resp.arrayBuffer());
        audioBuffers.push(buf);
        console.log(`[merge] Audio ${i + 1}: ${(buf.length / 1024).toFixed(0)} KB`);
      }

      if (audioBuffers.length > 0) {
        // Concatenate all audio buffers
        const totalAudioLen = audioBuffers.reduce((s, b) => s + b.length, 0);
        const concatenated = new Uint8Array(totalAudioLen);
        let offset = 0;
        for (const b of audioBuffers) { concatenated.set(b, offset); offset += b.length; }

        // Parse MP3 frames
        allAudioFrames = parseMP3Frames(concatenated);
        console.log(`[merge] Parsed ${allAudioFrames.length} MP3 frames from ${audioBuffers.length} audio files`);
      }
    }

    // Parse all video segments
    console.log(`[merge] Parsing ${buffers.length} segments with mp4box.js...`);
    const allSegments: TrackInfo[][] = [];
    for (let i = 0; i < buffers.length; i++) {
      const tracks = await parseMP4(buffers[i]);
      console.log(`[merge] Segment ${i + 1}: ${tracks.length} tracks, samples: ${tracks.map(t => t.samples.length).join('/')}`);
      if (tracks.some(t => t.samples.length === 0)) {
        console.warn(`[merge] Segment ${i + 1} has tracks with 0 samples`);
      }
      allSegments.push(tracks);
    }

    // Create merged MP4 (with optional audio)
    console.log(`[merge] Creating merged MP4${allAudioFrames ? ' with audio' : ''}...`);
    const mergedBuffer = createMergedMP4(allSegments, allAudioFrames);
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

    if (uploadError) throw new Error(`合并视频上传失败: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("video-assets").getPublicUrl(fileName);
    console.log(`[merge] Success: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        video_url: urlData.publicUrl,
        segments: video_urls,
        segment_count: video_urls.length,
        merged_size_mb: (mergedSize / 1024 / 1024).toFixed(1),
        has_audio: !!allAudioFrames,
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
