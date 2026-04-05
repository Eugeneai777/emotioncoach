

# 测试单个视频配音方案

## 目标

为视频1「凌晨3点崩溃时」生成中文配音，测试 ElevenLabs 中文语音质量。

## 步骤

### 1. 生成配音音频脚本

创建 `remotion/scripts/generate-test-voiceover.mjs`，调用已有的 `ELEVENLABS_API_KEY`，为视频1生成 3 段中文旁白：

| 段落 | 文案 | 时长目标 |
|------|------|----------|
| 痛点旁白 | "凌晨三点，你崩溃大哭。不想打扰任何人，翻来覆去，越想越慌。" | ~5s |
| 见证引述 | "晓晓说：凌晨三点崩溃大哭时，AI教练陪了我整整两个小时。" | ~5s |
| 品牌结语 | "有劲AI，24小时在线，随时接住你。" | ~3s |

- 使用 `eleven_multilingual_v2` 模型 + Brian 声音（已在项目 text-to-speech 函数中使用）
- 直接通过 ElevenLabs API 生成，保存到 `remotion/public/audio/` 目录
- 输出 3 个 MP3 文件

### 2. 添加音频到视频组件

修改 `remotion/src/VideoComposition.tsx`：
- 导入 `Audio` 和 `staticFile` 从 remotion
- 在对应 Sequence 中添加 `<Audio>` 组件，匹配 3 段旁白的时间轴

### 3. 渲染测试视频

修改 `remotion/scripts/render-remotion.mjs`：
- `muted: false` 启用音频
- 仅渲染 `video-1-midnight`
- 输出到 `/mnt/documents/video_1_midnight_with_voice.mp4`

### 改动文件

| 文件 | 说明 |
|------|------|
| `remotion/scripts/generate-test-voiceover.mjs` | 新建：调用 ElevenLabs 生成 3 段音频 |
| `remotion/src/VideoComposition.tsx` | 添加 `<Audio>` 组件 |
| `remotion/scripts/render-remotion.mjs` | 改 `muted: false`，单独渲染视频1 |

### 产出

- 3 个配音 MP3（存于 remotion/public/audio/）
- 1 个带配音的测试视频 `video_1_midnight_with_voice.mp4`

确认语音质量满意后，再为其余 4 个视频批量生成配音。

