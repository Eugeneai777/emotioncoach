

## 修复女性 AI 语音教练的声音性别

### 问题
`/mama` 女性专区入口的「女性AI语音教练」头像是女生，但点进去后默认声音是「温暖男声 Brian」(`nPczCjzI2devNBz1zQrb`)，性别错配。

### 根因
`src/config/voiceTypeConfig.ts` 中 `DEFAULT_VOICE_TYPE` 全站默认 = Brian 男声。所有语音教练页（`LifeCoachVoice`、`XiaojinVoice`、`WealthCoachVoice` 以及女性专区入口）通过 `getSavedVoiceType()` 读取同一个默认值，导致女性专区也走男声。

### 修复方案（最小改动，不影响其他场景）

**1. 定位女性专区语音入口**
先确认 `/mama` 下女性 AI 语音教练对应的页面/组件文件（推测为 `src/pages/mama/` 或 `WomenVoice` 类页面），找到其挂载 `<CoachVoiceChat>` 的位置。

**2. 显式传入女声 voiceType**
不动全站 `DEFAULT_VOICE_TYPE`，仅在该女性专区入口处硬编码传入 Sarah 温柔女声：

```tsx
<CoachVoiceChat
  ...
  voiceType="EXAVITQu4vr4xnSDxMaL"  // Sarah 温柔女声
/>
```

同时确保不读取 `getSavedVoiceType()`（避免被用户历史选择覆盖），或者读取时若历史值是男声则强制回落到 Sarah。

**3. 可选增强**：在该入口页保留 `<VoiceTypeSelector>`，但把可选项过滤为女声两款（Sarah 温柔女声、Lily 清新女声），用户仍可切换但不会切到男声，符合"女性 AI 教练"人设。

### 不影响范围
- 其他语音教练页（生活教练、小劲、财富教练）默认值 + 用户选择逻辑完全不动
- `voiceTypeConfig.ts` 全站常量、迁移逻辑不动
- 后端 token 接口、计费、OpenAI Realtime voice 映射不动

### 实施前需要先确认
执行时第一步会先 `code--search_files` 定位 `/mama` 下女性语音教练的入口文件名与现有 `voiceType` 传参方式，再做精准改动。

