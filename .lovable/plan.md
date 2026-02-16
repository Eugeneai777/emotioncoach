

# 财富智能语音记录未在财富简报中展现 - 问题分析与修复计划

## 问题根因

经过深入排查，发现存在 **两个核心问题**：

### 问题 1：语音通话数据存储到了错误的表

`CoachVoiceChat.tsx` 中的 `recordSession` 函数：
- **第 616 行**：`coach_key` 被硬编码为 `'vibrant_life_sage'`，无论实际使用的是哪个教练
- **第 654-671 行**：简报生成调用 `generate-life-briefing`，结果保存到 `vibrant_life_sage_briefings` 表
- 虽然第 722 行有一段专门针对财富教练的代码（调用 `generate-wealth-journal`），但日志显示该函数**从未被成功调用**

### 问题 2：财富简报页面只查询 `wealth_journal_entries`

`WealthCampCheckIn.tsx` 第 260 行仅查询 `wealth_journal_entries` 表，但：
- 文字教练对话的简报保存在 `wealth_coach_4_questions_briefings` 表（也未被查询）
- 语音对话的简报保存在 `vibrant_life_sage_briefings` 表（完全不相关）

### 数据验证

- `voice_chat_sessions` 表中所有语音记录的 `coach_key` 都是 `vibrant_life_sage`，没有财富教练的记录
- `generate-wealth-journal` 边缘函数完全没有执行日志
- `wealth_journal_entries` 中马亮最近的 2 条记录，所有内容字段（behavior_block, emotion_block 等）全部为空

## 修复计划

### 第 1 步：修复 `CoachVoiceChat.tsx` 中的 `coach_key` 硬编码问题

将 `coach_key` 从硬编码的 `'vibrant_life_sage'` 改为使用传入的 `coachTitle` 或新增一个 `coachKey` 属性，让不同教练的语音记录使用正确的标识。

### 第 2 步：修复语音通话后的财富简报生成逻辑

在 `CoachVoiceChat.tsx` 第 722 行的财富专属代码块中：
- 确保 `generate-wealth-journal` 的调用参数正确
- 添加更详细的错误日志
- 确保对话文本正确传递给 AI 提取函数

### 第 3 步：确保 `generate-wealth-journal` 边缘函数正常运行

检查并修复该函数，确保：
- 从语音对话中正确提取行为/情绪/信念卡点
- 正确写入 `wealth_journal_entries` 表（填充所有内容字段）
- 部署后验证函数可用

### 第 4 步：财富简报页面整合 `wealth_coach_4_questions_briefings` 数据

在 `WealthCampCheckIn.tsx` 的"财富简报"tab 中，除了查询 `wealth_journal_entries`，还要查询 `wealth_coach_4_questions_briefings` 表，将两种来源的简报合并展示（按时间排序），确保文字和语音教练对话产生的简报都能看到。

---

## 技术细节

### 涉及文件修改

| 文件 | 修改内容 |
|------|----------|
| `src/components/coach/CoachVoiceChat.tsx` | 修复 coach_key 硬编码；增强财富语音简报生成的错误处理和日志 |
| `src/pages/WealthCampCheckIn.tsx` | 在"财富简报"tab 中整合 `wealth_coach_4_questions_briefings` 数据源 |
| `supabase/functions/generate-wealth-journal/index.ts` | 确保语音来源的对话能正确提取内容并写入完整字段 |

### 数据流修复后

```text
语音教练对话结束
  --> CoachVoiceChat.recordSession()
    --> voice_chat_sessions (coach_key = '财富觉醒教练')
    --> generate-wealth-journal (source = 'voice_coach')
      --> wealth_journal_entries (填充完整内容字段)
        --> 财富简报 tab 展示
```

