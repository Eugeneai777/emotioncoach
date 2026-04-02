

# 为豆包语音通道增加简报生成能力

## 问题

豆包（Doubao）语音通道（`mode === 'emotion'`）结束对话后，`recordSession()` 走的是通用的 `generate-life-briefing` 路径，保存到 `vibrant_life_sage_briefings` 表。而 OpenAI 通道通过 function calling 调用 `save-emotion-voice-briefing`，保存到情绪专属的 `briefings` 表（含四阶段、情绪标签等结构化数据）。

**结果**：豆包语音的情绪对话没有生成结构化的情绪简报，在情绪教练的简报列表中看不到记录。

## 方案

### 1. 新建边缘函数 `generate-emotion-briefing-from-transcript`

接收原始对话文本，通过 Lovable AI 提取结构化情绪数据，然后复用 `save-emotion-voice-briefing` 的保存逻辑。

**输入**：`{ transcript, duration_minutes }`（需鉴权）

**AI 提取内容**（通过 tool calling 结构化输出）：
- `emotion_theme`：情绪主题
- `emotion_tags`：情绪标签数组
- `emotion_intensity`：1-10
- `stage_1_content` ~ `stage_4_content`：觉察/理解/反应/转化
- `insight`：洞察
- `action`：微行动建议
- `growth_story`：成长寄语

**保存逻辑**：复用 `save-emotion-voice-briefing` 中的三表写入（`conversations` → `emotion_coaching_sessions` → `briefings`）+ 标签关联 + 训练营自动打卡。

### 2. 修改 `CoachVoiceChat.tsx` 的 `recordSession()`

在 `isWealthCoach` 判断之后、通用简报逻辑之前，增加 `mode === 'emotion'` 分支：

```typescript
if (isWealthCoach) {
  // 财富教练...（已有）
} else if (mode === 'emotion') {
  // 情绪教练（含豆包通道）：生成结构化情绪简报
  if (transcriptContent && transcriptContent.length > 100) {
    const { data, error } = await supabase.functions.invoke(
      'generate-emotion-briefing-from-transcript',
      { body: { transcript: transcriptContent, duration_minutes: callMinutes } }
    );
    // 成功/失败处理 + onBriefingSaved 回调
  }
} else {
  // 通用简报（已有）
}
```

### 文件变更

| 文件 | 操作 |
|---|---|
| `supabase/functions/generate-emotion-briefing-from-transcript/index.ts` | **新建**，AI提取 + 三表写入 |
| `src/components/coach/CoachVoiceChat.tsx` | `recordSession()` 增加 emotion 分支 |

### 注意事项

- OpenAI 通道的 function calling 简报机制不受影响（它在对话中实时生成）
- 如果 OpenAI 通道已通过 function calling 生成了简报，`recordSession` 的 emotion 分支会额外生成一份。需要加去重检查：先查该用户最近5分钟内是否已有 briefing，有则跳过
- 使用 `LOVABLE_API_KEY` 调用 AI Gateway 提取结构化数据，无需额外 API Key

