
# 修复所有语音教练"误认文字交流"问题

## 问题
所有 6 个语音教练 Edge Function 的系统 Prompt 都没有告知 AI 当前是语音通话模式，导致 AI 默认认为是文字聊天，拒绝与现场的人打招呼等语音场景交互。

## 修复方案
在每个 Edge Function 的系统 Prompt 中添加统一的"语音交互声明"：

```text
【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流，可以感知用户的语气和周围环境。
如果用户提到身边有人，你可以自然地打招呼。
```

## 具体改动（6 个文件）

| 文件 | 修改位置 | 说明 |
|------|----------|------|
| `vibrant-life-realtime-token/index.ts` | `buildPersonaLayer()` 函数末尾（~第331行） | 核心人格层，被通用、情绪、亲子、场景模式共享 |
| `vibrant-life-realtime-token/index.ts` | `buildTeenInstructions()` 函数内（~第288行后） | 青少年版使用独立 Prompt，需单独添加 |
| `emotion-realtime-token/index.ts` | `buildPersonaLayer()` 函数末尾（~第49行） | 独立的情绪教练人格层 |
| `realtime-token/index.ts` | instructions 字符串开头（~第67行） | 小劲助手 |
| `teen-realtime-token/index.ts` | instructions 字符串开头（~第128行） | 小星青少年版 |
| `wealth-assessment-realtime-token/index.ts` | `buildWealthCoachInstructions()` 返回值开头（~第201行） | 财富觉醒教练 |
| `doubao-realtime-token/index.ts` | `getEmotionCoachInstructions()` 返回值开头（~第41行） | 豆包版情绪教练 |

## 改动量
- 6 个文件，每处添加约 5 行文本
- 纯 Prompt 文本修改，不涉及任何逻辑改动
- 部署后自动生效，无需前端改动
