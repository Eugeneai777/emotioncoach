

# 豆包与OpenAI情绪教练通道对齐

## 现状分析

| 能力 | 豆包通道 (doubao-realtime-relay) | OpenAI专用通道 (emotion-realtime-token) | OpenAI通用通道 (vibrant-life-realtime-token) |
|---|---|---|---|
| Prompt 深度 | 简版（~30行） | 详细版（~120行，含对话示例） | 有 emotionTools 的工具驱动 |
| Function Calling | ❌ 不支持 | ❌ 未配置工具 | ✅ track_emotion_stage, capture_emotion_event, generate_emotion_briefing |
| 实时阶段追踪 | ❌ | ❌ | ✅ |
| 对话后简报 | ✅ generate-emotion-briefing-from-transcript（刚实现） | N/A（未被使用） | ✅ 通过 function calling 实时生成 |
| 前端路由 | ✅ mode='emotion' 总是走这里 | ❌ 未被使用 | 仅通用模式使用 |

**关键发现**：前端 `mode === 'emotion'` 总是路由到豆包，`emotion-realtime-token` 端点目前未被任何前端代码实际调用。

## 对齐方案

### 1. 统一 Prompt：升级豆包通道的情绪教练 Prompt

将 `doubao-realtime-relay` 中的 `buildEmotionPrompt` 升级为与 `emotion-realtime-token` 一致的详细版，包含：
- 核心身份锁定
- 语言要求（简体中文）
- 详细四阶段指引（含图示）
- 核心技术（镜像、命名、下沉、留白、回应优先）
- 情绪强度分级响应策略
- 难以开口用户的引导策略
- 对话节奏规则
- 对话示例
- 完成信号与收尾话术

### 2. 清理未使用的 emotion-realtime-token

`emotion-realtime-token` 目前未被前端调用。两个选择：

- **保留但标记为备用**：万一需要切换回 OpenAI 通道时可用
- **删除**：减少维护负担

建议：保留，暂不改动。

### 3. 不需要改动的部分

- **对话后简报生成**：`generate-emotion-briefing-from-transcript` 已就绪，`recordSession()` 的 emotion 分支已实现
- **实时阶段追踪**：豆包不支持 function calling，无法实现实时追踪。但对话后的 AI 分析已能提取四阶段内容，效果等价
- **训练营自动打卡**：已在 briefing 保存逻辑中实现

## 文件变更

| 文件 | 操作 |
|---|---|
| `supabase/functions/doubao-realtime-relay/index.ts` | 升级 `buildEmotionPrompt`，对齐 `emotion-realtime-token` 的详细版 Prompt |

只需改动 1 个文件，约 30 行简版 Prompt 替换为 ~100 行详细版。

