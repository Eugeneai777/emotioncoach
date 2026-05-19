# Coach Voice Studio 路由接入 + 试听/预览增强

## 1. 接入路由（前端）

在 `src/App.tsx` 路由表里追加一行（与 `/mini-app` 同级，public 不需要登录）：

```tsx
<Route path="/coach-voice-studio" element={<CoachVoiceStudio />} />
```

加上 lazy import。访问 `/coach-voice-studio?key=youjin2026sop` 即可。

**Key 校验流程**（已在组件内实现，无需改动）：
- 无 `?key=` → 显示「缺少访问密钥」
- 有 `?key=` 但 edge function `validateAccessKey` 返回 403 → 显示「访问密钥无效」
- 校验通过 → 加载音色库 + 历史

## 2. 音色试听功能（新增）

**目标**：在「选音色」卡片上点小喇叭就能听到该音色样本，不必先生成才知道音色是否合适。

### 后端
- `coach-voice-library` edge function：返回 `sample_audio_url`
  - `source='preset'` → 用 ElevenLabs 公开 preview URL（每个 voice_id 有固定 preview mp3），直接存到 DB 字段 `sample_preview_url` 后下发
  - `source='cloned'` → 从 storage `sample_storage_path` 生成 1 小时签名 URL 下发
- migration: 给 `coach_voice_clones` 加 `sample_preview_url text`，并把 6 个 ElevenLabs preset 的 preview mp3 URL 写入（这些 URL 来自 ElevenLabs 公开 voices 接口，长期可用）

### 前端
- 音色卡片右上角加一个 ▶︎ 按钮，点击播放/暂停 `sample_audio_url`
- 用单例 `<audio>` ref 控制，切换卡片自动停上一个

## 3. 模板话术预览（新增）

**目标**：选模板时不用先选钩子就能看到 4 段式完整示例，方便快速判断哪个模板贴合。

### 前端
- 在「② 选模板」卡片底部加「点击展开看完整话术」折叠区
- 展开后渲染 `template.buildScript({ hookType: 'direct399' })` 和 `buildScript({ hookType: 'communityNurture' })` 两个版本并排
- 用 `<details>`/`Collapsible` 实现，无需新组件

## 4. 已生成历史的试听（小修）

历史卡片里 `audio_url` 目前是直链。改为：
- `coach-voice-history` edge function 对 `audio_storage_path` 生成 1 小时签名 URL 后下发为 `audio_url`
- 前端无需改动

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/App.tsx` | +1 行 lazy import +1 行 Route |
| `src/pages/CoachVoiceStudio.tsx` | 音色卡片加试听按钮；模板卡片加折叠预览；类型增加 `sample_audio_url` |
| `supabase/functions/coach-voice-library/index.ts` | select 增加 `sample_preview_url, sample_storage_path`；为 cloned 类型生成 signed URL；返回统一字段 `sample_audio_url` |
| `supabase/functions/coach-voice-history/index.ts` | 把 `audio_storage_path` → signed `audio_url` |
| 新 migration | `ALTER TABLE coach_voice_clones ADD COLUMN sample_preview_url text;` + UPDATE 6 个 preset 写入 ElevenLabs preview mp3 URL |

## 不改动

- 数据库 RLS、bucket、其他 edge functions、`coachVoiceTemplates.ts`、access_key 机制

完成后访问 `https://eugeneai.me/coach-voice-studio?key=youjin2026sop` 即可使用全部功能。