

# 测试火山引擎 TTS 配音

TTS 服务已开通，现在可以直接测试。

## 步骤

### 1. 部署 volcengine-tts edge function
确保最新版本已部署。

### 2. 运行现有脚本生成配音
`remotion/scripts/generate-test-voiceover.mjs` 已配置好，调用 `volcengine-tts` 为视频1生成 3 段中文旁白（温柔女声 `zh_female_cancan_mars_bigtts`）。

### 3. 渲染带配音的测试视频
用 ffmpeg 将生成的 3 段音频合并到 video-1-midnight 视频中，输出 `video_1_midnight_doubao_voice.mp4`。

### 改动
- 无需修改任何文件，所有代码已就位
- 仅需执行：部署 → 生成音频 → 渲染视频

### 产出
- `/mnt/documents/video_1_midnight_doubao_voice.mp4` — 火山引擎中文配音版本

