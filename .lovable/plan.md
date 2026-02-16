
## 将财富语音教练对话记录保存到财富日记

### 问题分析

当前 `CoachVoiceChat` 组件在通话结束时（`recordSession` 函数），只将对话记录保存到通用的 `vibrant_life_sage_briefings` 表和 `voice_chat_sessions` 表。当使用财富语音教练（`tokenEndpoint="wealth-assessment-realtime-token"`）时，对话内容不会保存到 `wealth_journal_entries`（财富日记表），导致语音对话的觉察内容无法在"成长曲线"和"觉醒档案"中体现。

### 方案

在 `CoachVoiceChat` 的 `recordSession` 函数中，检测是否为财富教练通话（通过 `tokenEndpoint` 或 `featureKey` 判断）。如果是，则在通话结束后额外调用 `generate-wealth-journal` Edge Function，将语音对话的 transcript 传入，由 AI 提取行为/情绪/信念卡点并生成财富日记条目。

### 技术变更

| 文件 | 修改内容 |
|------|---------|
| `src/components/coach/CoachVoiceChat.tsx` | 在 `recordSession` 函数中（约第 649-719 行的简报生成逻辑之后），增加财富教练专属的日记生成逻辑 |

#### 具体修改：`recordSession` 函数

在现有的 `vibrant_life_sage_briefings` 保存逻辑之后，增加以下判断：

```text
// 现有逻辑结束后...

// 财富教练专属：将语音对话保存到财富日记
if (tokenEndpoint === 'wealth-assessment-realtime-token' && transcriptContent.length > 50) {
  try {
    // 构建对话历史格式（generate-wealth-journal 需要的格式）
    const conversationHistory = [
      ...userTranscript.split('\n').filter(Boolean).map(t => ({ role: 'user', content: t })),
      ...transcript.split('\n').filter(Boolean).map(t => ({ role: 'assistant', content: t })),
    ];

    // 获取当前训练营信息（如有）
    const { data: campData } = await supabase
      .from('wealth_camp_members')
      .select('camp_id, current_day')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.functions.invoke('generate-wealth-journal', {
      body: {
        user_id: user.id,
        camp_id: campData?.camp_id || null,
        day_number: campData?.current_day || 1,
        conversation_history: conversationHistory,
        source: 'voice_coach'  // 标记来源为语音教练
      }
    });

    console.log('[VoiceChat] 财富日记已从语音对话生成');
  } catch (journalError) {
    console.error('[VoiceChat] 财富日记生成失败:', journalError);
  }
}
```

#### `generate-wealth-journal` Edge Function

该函数已经支持从 `conversation_history` 中提取卡点信息（第 98-153 行），无需修改。当 `briefing_data` 为空但 `conversation_history` 存在时，它会自动调用 AI 提取行为/情绪/信念卡点并评分。

### 效果

- 用户与财富语音教练通话结束后，系统自动将对话内容分析并保存到财富日记
- 在"觉醒档案"的成长曲线、成就徽章等模块中能看到语音对话产生的数据
- 不影响现有的通用语音教练逻辑（通过 `tokenEndpoint` 判断，仅财富教练触发）
- `generate-wealth-journal` 已有去重机制，不会产生重复日记
