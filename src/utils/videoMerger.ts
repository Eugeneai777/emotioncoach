/**
 * Client-side video merger using ffmpeg.wasm
 * Properly concatenates MP4 files (binary concat doesn't work for MP4)
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const FFMPEG_LOAD_TIMEOUT_MS = 60_000; // 60s timeout for loading engine

async function getFFmpeg(onProgress?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  // Prevent multiple parallel loads
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    onProgress?.('正在下载视频处理引擎...');

    // Use version matching installed @ffmpeg/ffmpeg 0.12.x
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

    const [coreURL, wasmURL, workerURL] = await Promise.all([
      toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    ]);

    onProgress?.('正在初始化视频处理引擎...');

    // Load with timeout protection
    const loadResult = await Promise.race([
      ffmpeg.load({ coreURL, wasmURL, workerURL }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('视频处理引擎加载超时（60秒），请检查网络后重试')), FFMPEG_LOAD_TIMEOUT_MS)
      ),
    ]);

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadPromise;
  } catch (e) {
    loadPromise = null;
    ffmpegInstance = null;
    throw e;
  }
}

export async function mergeVideosClientSide(
  videoUrls: string[],
  onProgress?: (message: string) => void,
): Promise<Blob> {
  if (videoUrls.length === 0) throw new Error('没有视频片段');
  if (videoUrls.length === 1) {
    onProgress?.('仅一个片段，直接下载...');
    const resp = await fetch(videoUrls[0]);
    return resp.blob();
  }

  onProgress?.('正在加载视频处理引擎（首次约需30秒）...');

  let ffmpeg: FFmpeg;
  let retries = 0;
  const maxRetries = 1;

  while (true) {
    try {
      ffmpeg = await getFFmpeg(onProgress);
      break;
    } catch (err) {
      if (retries < maxRetries) {
        retries++;
        console.warn(`ffmpeg.wasm 加载失败（第${retries}次），自动重试...`, err);
        onProgress?.(`引擎加载失败，正在重试（${retries}/${maxRetries}）...`);
        // Reset for retry
        loadPromise = null;
        ffmpegInstance = null;
        continue;
      }
      console.error('ffmpeg.wasm 加载失败:', err);
      throw new Error('视频处理引擎加载失败，请检查网络后重试');
    }
  }

  // Validate segment URLs are accessible
  onProgress?.('正在校验视频片段...');
  for (let i = 0; i < videoUrls.length; i++) {
    try {
      const headResp = await fetch(videoUrls[i], { method: 'HEAD' });
      if (!headResp.ok) {
        throw new Error(`片段 ${i + 1} 不可访问 (HTTP ${headResp.status})`);
      }
    } catch (e: any) {
      if (e.message.includes('片段')) throw e;
      throw new Error(`片段 ${i + 1} 网络请求失败: ${e.message}`);
    }
  }

  // Download all segments and write to ffmpeg virtual FS
  const fileNames: string[] = [];
  for (let i = 0; i < videoUrls.length; i++) {
    onProgress?.(`正在下载片段 ${i + 1}/${videoUrls.length}...`);
    const fileName = `input${i}.mp4`;
    const data = await fetchFile(videoUrls[i]);
    await ffmpeg.writeFile(fileName, data);
    fileNames.push(fileName);
  }

  // Create concat list file
  const concatList = fileNames.map(f => `file '${f}'`).join('\n');
  await ffmpeg.writeFile('list.txt', new TextEncoder().encode(concatList));

  onProgress?.('正在执行视频合并（无损拼接）...');

  // Use concat demuxer — re-muxes without re-encoding (fast)
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'list.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  onProgress?.('正在读取合并结果...');
  const outputData = await ffmpeg.readFile('output.mp4') as Uint8Array;

  // Cleanup virtual FS
  for (const f of fileNames) {
    await ffmpeg.deleteFile(f);
  }
  await ffmpeg.deleteFile('list.txt');
  await ffmpeg.deleteFile('output.mp4');

  if (outputData.length < 1000) {
    throw new Error('合并结果文件异常（文件过小），请重试');
  }

  const blob = new Blob([new Uint8Array(outputData.buffer as ArrayBuffer)], { type: 'video/mp4' });
  onProgress?.(`合并完成，文件大小: ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
  return blob;
}
