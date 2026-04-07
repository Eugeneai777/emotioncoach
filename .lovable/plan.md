

# 可用 TTS 方案对比

## 现状

你的项目已有两个 TTS 边缘函数：
- `text-to-speech` — 使用 **ElevenLabs**（`ELEVENLABS_API_KEY` 已配置，可直接使用）
- `volcengine-tts` — 使用豆包/火山引擎（当前凭证有问题）

视频生成流程 (`useVideoGeneration.ts`) 当前调用的是 `volcengine-tts`。

## 方案一：直接切换到 ElevenLabs（推荐，最快）

ElevenLabs 已经配置好，API Key 已就位，`text-to-speech` 函数可用。

**改动**：
- 修改 `useVideoGeneration.ts`，将 TTS 调用从 `volcengine-tts` 改为 `text-to-speech`
- ElevenLabs 支持中文（`eleven_multilingual_v2` 模型）
- 声音选择：使用 ElevenLabs Voice Library 的声音 ID 替代豆包音色

**优点**：零配置，立即可用
**缺点**：ElevenLabs 按字符计费，中文声音效果可能不如豆包自然

## 方案二：继续修复豆包 TTS

重新在火山引擎控制台创建应用，获取匹配的 APP_ID + Access Token。

**优点**：中文语音质量最佳
**缺点**：需要在控制台排查凭证问题

## 方案三：使用 Lovable AI 支持的模型生成语音

Lovable 内置的 AI 模型不包含 TTS 能力，不适用。

## 建议

**先用方案一（ElevenLabs）跑通端到端流程**，后续再切回豆包。只需改一个文件 `useVideoGeneration.ts`，将 `volcengine-tts` 替换为 `text-to-speech` 并适配参数即可。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/hooks/useVideoGeneration.ts` | 修改 TTS 调用为 ElevenLabs |
| `src/config/voiceTypeConfig.ts` | 适配 ElevenLabs voice ID（可选） |

