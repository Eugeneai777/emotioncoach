
# 添加豆包语音音色选择功能

## 概述
为情绪教练的豆包语音服务添加音色选择功能，让用户可以选择不同的 AI 声音风格（包括智慧长者 `BV158_streaming`）。

## 当前架构分析

数据流：
1. **前端 (Index.tsx)** → 点击语音按钮 → `CoachVoiceChat` 组件
2. **CoachVoiceChat.tsx** → 创建 `DoubaoRealtimeChat` 客户端
3. **DoubaoRealtimeChat.ts** → 调用 `doubao-realtime-token` 获取配置
4. **doubao-realtime-token** → 返回 relay URL 和教练 prompt
5. **DoubaoRealtimeChat.ts** → 连接 `doubao-realtime-relay` WebSocket
6. **doubao-realtime-relay** → 发送 `StartSession` 到豆包 API（**此处需要传递 voice_type**）

## 可用音色列表（基于火山引擎文档）

| 音色名称 | voice_type | 适用场景 |
|---------|------------|---------|
| 渊博小叔 | zh_male_yuanboxiaoshu_moon_bigtts | 智慧男声 |
| 心灵鸡汤 | zh_female_xinlingjitang_moon_bigtts | 温暖女声 |
| 深夜播客 | zh_male_shenyeboke_moon_bigtts | 磁性男声 |
| 温柔淑女 | zh_female_wenroushunv_mars_bigtts | 温柔女声 |
| 儒雅青年 | zh_male_ruyaqingnian_mars_bigtts | 儒雅男声 |
| 霸气青叔 | zh_male_baqiqingshu_mars_bigtts | 成熟男声 |
| 智慧长者 | BV158_streaming | 年长男声（用户指定） |

## 实现方案

### 1. 创建音色配置常量文件
创建 `src/config/voiceTypeConfig.ts`：
- 定义音色选项数组（id, name, voice_type, description, gender, style）
- 默认音色选择（渊博小叔 - 智慧男声）

### 2. 创建音色选择器组件
创建 `src/components/emotion-coach/VoiceTypeSelector.tsx`：
- 显示可选音色列表（图标 + 名称 + 描述）
- 使用 localStorage 持久化用户选择
- 支持预览音色（可选，后续迭代）

### 3. 修改 Index.tsx
更新 `/emotion-coach` 页面：
- 在 `EmotionVoiceCallCTA` 下方添加音色选择器
- 读取用户选择的音色并传递给 `CoachVoiceChat`

### 4. 修改 CoachVoiceChat 组件
更新 `src/components/coach/CoachVoiceChat.tsx`：
- 新增 `voiceType?: string` prop
- 传递音色参数到 `DoubaoRealtimeChat`

### 5. 修改 DoubaoRealtimeChat 客户端
更新 `src/utils/DoubaoRealtimeAudio.ts`：
- 新增 `voiceType?: string` 选项
- 将 voice_type 包含在 `session.init` 请求中

### 6. 修改 doubao-realtime-token Edge Function
更新 `supabase/functions/doubao-realtime-token/index.ts`：
- 接收并返回 voice_type 参数

### 7. 修改 doubao-realtime-relay Edge Function
更新 `supabase/functions/doubao-realtime-relay/index.ts`：
- 在 `buildStartSessionRequest` 中添加 `tts.voice_type` 参数
- 从前端 `session.init` 消息中读取 voice_type

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/config/voiceTypeConfig.ts` | 新建 | 音色配置常量 |
| `src/components/emotion-coach/VoiceTypeSelector.tsx` | 新建 | 音色选择器组件 |
| `src/pages/Index.tsx` | 修改 | 集成音色选择器 |
| `src/components/coach/CoachVoiceChat.tsx` | 修改 | 添加 voiceType prop |
| `src/utils/DoubaoRealtimeAudio.ts` | 修改 | 传递 voiceType 到 relay |
| `supabase/functions/doubao-realtime-token/index.ts` | 修改 | 返回 voice_type 配置 |
| `supabase/functions/doubao-realtime-relay/index.ts` | 修改 | 使用 voice_type 参数 |

## 技术细节

### 音色配置示例
```typescript
// src/config/voiceTypeConfig.ts
export const VOICE_TYPE_OPTIONS = [
  {
    id: 'wise_elder',
    name: '智慧长者',
    voice_type: 'BV158_streaming',
    description: '年长男声，沉稳睿智',
    gender: 'male',
    style: 'wise'
  },
  {
    id: 'wise_uncle',
    name: '渊博小叔',
    voice_type: 'zh_male_yuanboxiaoshu_moon_bigtts',
    description: '成熟男声，儒雅博学',
    gender: 'male',
    style: 'gentle'
  },
  {
    id: 'warm_female',
    name: '心灵鸡汤',
    voice_type: 'zh_female_xinlingjitang_moon_bigtts',
    description: '温暖女声，治愈心灵',
    gender: 'female',
    style: 'warm'
  },
  {
    id: 'gentle_lady',
    name: '温柔淑女',
    voice_type: 'zh_female_wenroushunv_mars_bigtts',
    description: '柔和女声，亲切温婉',
    gender: 'female',
    style: 'gentle'
  }
];

export const DEFAULT_VOICE_TYPE = 'BV158_streaming'; // 智慧长者
```

### relay 修改关键点
在 `buildStartSessionRequest` 函数中，需要在 `tts` 配置中添加 `voice_type`：
```typescript
tts: {
  audio_config: {
    channel: 1,
    format: 'pcm_s16le',
    sample_rate: 24000,
  },
  voice_type: voiceType || 'BV158_streaming'  // 新增
}
```

### 数据传递链路
```
用户选择音色 (localStorage)
       ↓
Index.tsx (读取 localStorage)
       ↓
CoachVoiceChat (voiceType prop)
       ↓
DoubaoRealtimeChat (voiceType option)
       ↓
session.init WebSocket 消息 {type: 'session.init', voice_type: '...'}
       ↓
doubao-realtime-relay (读取并传递)
       ↓
豆包 StartSession API (tts.voice_type)
```

## UI 设计
音色选择器放置在语音通话按钮下方，使用小型胶囊选择器：
- 水平滚动的音色卡片
- 当前选中音色高亮显示
- 点击切换音色
- 使用 emoji 区分男女声音（👨 / 👩）

## 默认值
根据用户需求，默认音色设置为 **智慧长者 (BV158_streaming)**，年长男声风格。
