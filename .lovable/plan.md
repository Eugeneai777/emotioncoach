

# 情绪教练豆包语音 - 角色Prompt与音色修复计划

## 问题分析

经过代码审查，发现以下问题：

### 1. Prompt 传递链路分析
当前数据流是正确的：
```
doubao-realtime-token (生成「静老师」prompt)
       ↓
DoubaoRealtimeAudio.ts (获取 config.instructions)
       ↓
session.init WebSocket 消息 {type: 'session.init', instructions: '...'}
       ↓
doubao-realtime-relay (读取 sessionConfig.instructions)
       ↓
豆包 StartSession API (request.system_role = instructions)
```

**结论**：Prompt 传递链路是正确的，「静老师」角色定义已正确传递到豆包。

### 2. 音色问题
- `doubao-realtime-relay` 已支持 `voiceType` 参数（第 394 行）
- `DoubaoRealtimeAudio.ts` 已发送 `voice_type`（第 395 行）
- **但问题是**：`doubao-realtime-token` 没有返回 `voice_type` 字段
- 前端 `config` 对象中缺少 `voice_type`，导致使用硬编码的默认值 `'BV158_streaming'`

### 3. 用户体验问题
- 计划中的音色选择器 `VoiceTypeSelector.tsx` 和配置文件 `voiceTypeConfig.ts` 尚未创建
- 用户无法选择不同的 AI 声音

## 实现计划

### 步骤 1: 创建音色配置常量文件
**文件**: `src/config/voiceTypeConfig.ts`

定义可用音色列表，包括：
- 智慧长者 (`BV158_streaming`) - 年长男声，设为默认
- 渊博小叔 (`zh_male_yuanboxiaoshu_moon_bigtts`) - 成熟男声
- 心灵鸡汤 (`zh_female_xinlingjitang_moon_bigtts`) - 温暖女声
- 温柔淑女 (`zh_female_wenroushunv_mars_bigtts`) - 柔和女声

### 步骤 2: 创建音色选择器组件
**文件**: `src/components/emotion-coach/VoiceTypeSelector.tsx`

功能：
- 显示可选音色列表（胶囊卡片形式）
- 使用 localStorage 持久化用户选择
- 使用 emoji 区分男声/女声

### 步骤 3: 修改 Index.tsx 集成音色选择器
**文件**: `src/pages/Index.tsx`

改动：
- 添加 `selectedVoiceType` state
- 读取 localStorage 中的用户选择
- 在 `EmotionVoiceCallCTA` 下方添加 `VoiceTypeSelector`
- 传递 `voiceType` prop 给 `CoachVoiceChat`

### 步骤 4: 修改 CoachVoiceChat 组件
**文件**: `src/components/coach/CoachVoiceChat.tsx`

改动：
- 新增 `voiceType?: string` prop
- 创建 `DoubaoRealtimeChat` 时传递 `voiceType`

### 步骤 5: 修改 DoubaoRealtimeChat 客户端
**文件**: `src/utils/DoubaoRealtimeAudio.ts`

改动：
- 构造函数添加 `voiceType?: string` 选项
- 在 `sendSessionInit()` 中使用传入的 `voiceType`（而非从 config 读取）

### 步骤 6: 修改 doubao-realtime-token 添加调试日志
**文件**: `supabase/functions/doubao-realtime-token/index.ts`

改动：
- 添加 prompt 长度和预览的调试日志
- 确认 instructions 正确返回

## 数据传递链路（完整版）

```text
用户点击音色 → VoiceTypeSelector
       ↓
localStorage 保存 → voice_type_preference
       ↓
Index.tsx → 读取 localStorage → selectedVoiceType state
       ↓
<CoachVoiceChat voiceType={selectedVoiceType} />
       ↓
new DoubaoRealtimeChat({ voiceType })
       ↓
sendSessionInit() → {type: 'session.init', instructions, voice_type}
       ↓
doubao-realtime-relay → sessionConfig.voiceType
       ↓
buildStartSessionRequest() → tts.voice_type
       ↓
豆包 API → 使用指定音色输出语音
```

## 文件变更清单

| 文件 | 操作 | 说明 |
|-----|------|-----|
| `src/config/voiceTypeConfig.ts` | 新建 | 音色配置常量 |
| `src/components/emotion-coach/VoiceTypeSelector.tsx` | 新建 | 音色选择器组件 |
| `src/pages/Index.tsx` | 修改 | 集成音色选择器，传递 voiceType |
| `src/components/coach/CoachVoiceChat.tsx` | 修改 | 添加 voiceType prop |
| `src/utils/DoubaoRealtimeAudio.ts` | 修改 | 构造函数支持 voiceType |
| `supabase/functions/doubao-realtime-token/index.ts` | 修改 | 添加调试日志 |

## 默认音色
根据需求，默认音色设置为 **智慧长者 (BV158_streaming)**，年长男声风格。

## 验证方法
1. 打开情绪教练页面
2. 查看音色选择器，确认默认选中「智慧长者」
3. 开始语音通话
4. 检查 Edge Function 日志中的 `session.init` 消息，确认 `voice_type` 和 `instructions` 正确
5. 验证 AI 使用男性老年声音回复，语气符合「静老师」温暖专业的风格

