/**
 * Client-side video merger using ffmpeg.wasm
 * Properly concatenates MP4 files (binary concat doesn't work for MP4)
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  
  // Use single-threaded core from CDN (no SharedArrayBuffer needed)
  const coreURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js';
  const wasmURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm';

  await ffmpeg.load({
    coreURL,
    wasmURL,
  });
  
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function mergeVideosClientSide(
  videoUrls: string[],
  onProgress?: (message: string) => void,
): Promise<Blob> {
  if (videoUrls.length === 0) throw new Error('没有视频片段');
  if (videoUrls.length === 1) {
    const resp = await fetch(videoUrls[0]);
    return resp.blob();
  }

  onProgress?.('正在加载视频处理引擎...');
  const ffmpeg = await getFFmpeg();

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

  onProgress?.('正在合并视频...');

  // Use concat demuxer — re-muxes without re-encoding (fast)
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'list.txt',
    '-c', 'copy',
    'output.mp4',
  ]);

  const outputData = await ffmpeg.readFile('output.mp4') as Uint8Array;

  // Cleanup virtual FS
  for (const f of fileNames) {
    await ffmpeg.deleteFile(f);
  }
  await ffmpeg.deleteFile('list.txt');
  await ffmpeg.deleteFile('output.mp4');

  const blob = new Blob([new Uint8Array(outputData.buffer as ArrayBuffer)], { type: 'video/mp4' });
  onProgress?.(`合并完成，文件大小: ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
  return blob;
}
