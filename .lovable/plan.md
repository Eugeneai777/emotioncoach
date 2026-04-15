

# 为漫剧视频添加音频支持

## 问题

即梦（Volcengine）视频生成 API 只产出画面，不含音频。当前流程中没有 TTS 或音频混合步骤，所以合并后的视频始终是静音的。

## 方案

在视频生成完成后、合并下载前，增加"旁白配音 + 背景音乐"的音频层。

### 1. 为每个分镜生成 TTS 旁白

- 每个分镜已有 `narration`（旁白文案）字段
- 复用现有的豆包（Volcengine）TTS 边缘函数（`tts-doubao`），为每个分镜文案生成语音音频
- 前端在视频生成完成后，自动（或手动触发）为每个分镜生成对应旁白音频

### 2. 修改 merge-videos 边缘函数

- 接收额外参数：每个视频片段对应的音频 URL
- 在服务端使用 ffmpeg 将每个分镜的视频 + 旁白音频合成
- 可选：叠加背景音乐（低音量）

### 3. 前端 UI 调整

- 在分镜卡片中显示旁白音频生成状态
- 增加"生成配音"按钮或在视频生成完成后自动触发
- 合并下载时传入音频 URL 列表

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/admin/DramaScriptGenerator.tsx` | 增加 TTS 生成逻辑、音频状态管理、UI 按钮 |
| `supabase/functions/merge-videos/index.ts` | 支持视频+音频合并参数 |
| `src/utils/videoMerger.ts` | 传递音频 URL 到 merge 函数 |

## 技术细节

- TTS 使用已有的 `tts-doubao` 函数，无需新增 API Key
- merge-videos 边缘函数中用 ffmpeg 的 `-i video -i audio -shortest` 合成
- 每个分镜独立合成后再拼接，确保旁白与画面时长对齐

