

# 视频+音频合成为一个完整长视频

## 当前状态
- 视频：Jimeng API 生成纯画面 MP4（无音轨），通过 `merge-videos` 边缘函数用 mp4box.js 拼接
- 音频：TTS 生成 MP3 base64，仅存在前端内存，视频和音频完全独立

## 方案：服务端一体化合并

### 核心思路
1. 前端生成 TTS 后，将每个场景的音频上传到 Supabase Storage
2. 合并时将音频 URL 一并传给 `merge-videos` 边缘函数
3. 边缘函数内：先将所有 MP3 音频拼接，再用 mp4box.js 将合并音频作为音轨写入合并后的 MP4

### 步骤

#### 1. 前端：TTS 音频上传到 Storage
- 生成 TTS 后，将 base64 音频上传到 `video-assets` bucket（路径: `audio/{userId}/{timestamp}-scene{N}.mp3`）
- 在 `sceneAudios` state 中记录上传后的公开 URL

#### 2. 前端：合并下载时传递音频 URL
- 修改 `handleMergeDownload`，收集所有场景的音频 URL
- 修改 `mergeVideosClientSide` 函数签名，增加 `audioUrls` 参数
- 调用 `merge-videos` 时一并传入 `audio_urls`

#### 3. 边缘函数：merge-videos 支持音频合并
- 接收可选的 `audio_urls` 数组（与 `video_urls` 一一对应）
- 下载所有音频文件，拼接为一个完整 MP3 buffer
- 编写轻量 MP3 帧解析器（MP3 帧头固定格式，约 30 行代码），将 MP3 拆分为独立帧
- 在 mp4box.js 输出文件中新增一条 `mp3` 音频轨道，逐帧添加 sample
- 最终输出的 MP4 同时包含视频轨和音频轨

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/admin/DramaScriptGenerator.tsx` | TTS 生成后上传 storage，合并时传 audio_urls |
| `src/utils/videoMerger.ts` | 增加 audioUrls 参数 |
| `supabase/functions/merge-videos/index.ts` | 接收 audio_urls，MP3 帧解析，添加音频轨 |

### 技术细节
- MP3 帧头：以 `0xFF 0xE*` 开头，帧长度可从 bitrate/samplerate 计算，解析成本极低
- mp4box.js 的 `addTrack({ type: 'mp3', hdlr: 'soun' })` 可创建 MP3-in-MP4 音轨
- 音频拼接顺序与视频片段顺序一致，确保画面与旁白同步
- 若某个场景无音频 URL，用静默填充对应时长

