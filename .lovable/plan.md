
# 方案 A：Coach Voice Studio 切换到 Doubao 中文 TTS

## 1. 数据库迁移

`coach_voice_clones` 表新增一列：

- `doubao_voice_type text` — Doubao BigTTS speaker（如 `zh_male_M392_conversation_wvae_bigtts`），preset 必填、cloned 留空。

不动 `elevenlabs_voice_id`（克隆 Tab 还要用）。

清掉 6 个 preset 已缓存的 `sample_preview_url`（之前缓存的是英文 mp3），等下次访问时用 Doubao 重新合成。

## 2. 6 个预设音色替换为 Doubao 中文音色

| coach_name | gender | doubao_voice_type | 定位 |
|---|---|---|---|
| 沉稳磁性男 | male | `zh_male_M392_conversation_wvae_bigtts` | 35-55 中年男对话感 |
| 温暖兄长男 | male | `zh_male_xudong_conversation_wvae_bigtts` | 兄长 / 邻家大哥 |
| 醇厚长者男 | male | `zh_male_baqiqingshu_mars_bigtts` | 沉稳长者 / 播音感 |
| 温柔姐姐女 | female | `zh_female_wanwanxiaohe_moon_bigtts` | 温柔知性姐姐 |
| 治愈轻语女 | female | `zh_female_roumeinvyou_emo_v2_mars_bigtts` | 柔美治愈、轻语感 |
| 知性主理女 | female | `zh_female_zhixingnvsheng_mars_bigtts` | 知性主理人 |

> 这些是 Doubao BigTTS 标准 speaker，需在火山引擎控制台已开通对应音色权限。如哪个音色未开通，可后续单独换掉那一行的 `doubao_voice_type`，无需改代码。

## 3. 后端改动

### `coach-voice-generate`
- 移除 ElevenLabs 调用。
- 读取 `doubao_voice_type`（preset）；如果是 `cloned`（无 doubao_voice_type），暂时回退到 ElevenLabs（保留克隆音色可用）。
- 复用 `volcengine-tts` 的「V3 优先 → V1 兜底」双重重试逻辑（已成熟），抽到 `_shared/doubao-tts.ts` 共享。
- 拿到 mp3 buffer 后照旧上传 storage + 入库 + 返回 signedUrl + base64。

### `coach-voice-library`
- preset 的预览策略改为：
  - 若 `sample_preview_url` 存在 → 直接返回。
  - 否则用 Doubao 合成一段固定中文 demo（约 15s），上传到 `voice-recordings/coach-studio/previews/{voice_id}.mp3`，回写 `sample_storage_path` + 24h signed URL 缓存。
- 预览 demo 文案（按性别）：
  - 男：「兄弟，状态校准这件事，三十几岁之后，比拼命更重要。今晚做一件事，给自己留一份预警雷达。」
  - 女：「姐妹，最近的状态我看见了。你不是不够好，是太久没把自己放在前面。今晚，给自己留一个温柔的小动作。」
- cloned 类型逻辑不变（ElevenLabs preview / storage signed URL）。

### `_shared/doubao-tts.ts`（新增）
抽取 `volcengine-tts/index.ts` 里的 `tryV3TTS` / `tryV1TTS` 与重试编排，导出 `synthesizeDoubaoMp3(text, voiceType) → Uint8Array`。

## 4. 前端改动（`CoachVoiceStudio.tsx`）

- 卡片描述与页面副标题：去掉 ElevenLabs 字样，改为「中文 Doubao 教练音色」。
- 「克隆音色」Tab 顶部加一行小字提示：「克隆音色基于 ElevenLabs，中文场景略带口音；正式跟进建议先用上方 Doubao 预设音色。」
- VoiceCard / 模板预览 / 生成调用方式不变（仍然走 `coach-voice-generate`，只是后端切换了引擎）。

## 5. 不改动

- 路由、Key 校验、模板话术（`coachVoiceTemplates.ts`）、克隆流程、`coach-voice-history`。
- ElevenLabs API Key 仍保留，用于 cloned tab。

## 6. 部署 & 验证

部署 4 个 edge function（generate / library / clone / history 因 shared 文件变动需要一起部署），随后：

- 访问 `/coach-voice-studio?key=youjin2026sop`
- 试听 6 个预设 → 应听到中文 demo（首发会有 ~2s 合成延迟，之后秒开）
- 选模板 + 生成 → 中文 mp3，沉稳磁性男听起来应是国语对话感

## 文件改动清单

| 文件 | 改动 |
|---|---|
| 新 migration | `ALTER TABLE coach_voice_clones ADD COLUMN doubao_voice_type text;` + UPDATE 6 行 + 清 `sample_preview_url` |
| 新增 `supabase/functions/_shared/doubao-tts.ts` | 抽取共享 TTS 调用 |
| `supabase/functions/coach-voice-generate/index.ts` | 切到 Doubao（cloned 走 ElevenLabs 兜底） |
| `supabase/functions/coach-voice-library/index.ts` | preset 预览用 Doubao 按需合成 + 缓存 |
| `src/pages/CoachVoiceStudio.tsx` | 文案微调、克隆 tab 提示 |

确认无误后我开始执行。
