

## 让字幕跟随 delta 节奏平滑更新 + 停顿期不闪烁

### 当前问题
1. **节奏失真**：每个 `audio_transcript.delta` 到达就立刻 `setLatestAiLine`，文字会一阵阵跳跃式追加（OpenAI Realtime 的 delta 经常一次涌来 30+ 个 chunk，瞬间打满，不像语音"逐字吐"的节奏）
2. **停顿闪烁**：句子结束（`audio_transcript.done`）时 `setLatestAiLine(sanitizedText)` 会用「完整文本」替换「累积的 delta」。两者通常一致，但偶尔身份替换或空白处理差一格 → DOM diff 触发整段重渲，光标和文字闪一下
3. **新一轮空白期**：上一轮 done 后到下一轮第一个 delta 之间（几百毫秒到几秒），如果直接清空就会出现"空字幕→文字突然出现"的闪烁

### 修复方案

#### 一、Delta 缓冲 + rAF 节流（按音频时间戳节奏吐字）

在 `handleTranscript` 中，不再每次 delta 都直接 setState。改为：

1. **累积到 ref**：`pendingDeltaRef.current += sanitizedText`（已有 `currentAssistantDeltaRef` 在做这事）
2. **rAF 调度**：用 `requestAnimationFrame` 把 setState 合并到下一帧。多个 delta 在 16ms 内到达只触发一次重渲
3. **追加节奏感**：记录每个 delta 的到达时间戳 `lastDeltaTsRef`。如果两次 delta 间隔 > 60ms（说明是音节边界，不是网络突发），立刻 flush；如果 < 60ms（网络突发，多 chunk 同时到），合并到同一帧

新增 refs：
```ts
const aiFlushRafRef = useRef<number | null>(null);
const lastDeltaTsRef = useRef<number>(0);
```

新增 helper：
```ts
const scheduleAiFlush = () => {
  if (aiFlushRafRef.current != null) return;
  aiFlushRafRef.current = requestAnimationFrame(() => {
    aiFlushRafRef.current = null;
    setLatestAiLine(currentAssistantDeltaRef.current);
    setTranscript(/* ... */);
  });
};
```

delta 分支替换为：
```ts
currentAssistantDeltaRef.current += sanitizedText;
const now = performance.now();
const gap = now - lastDeltaTsRef.current;
lastDeltaTsRef.current = now;
if (gap > 60) {
  // 音节间隔，立刻渲染（保持节奏）
  if (aiFlushRafRef.current != null) cancelAnimationFrame(aiFlushRafRef.current);
  aiFlushRafRef.current = null;
  setLatestAiLine(currentAssistantDeltaRef.current);
} else {
  // 突发 chunk，合并到下一帧
  scheduleAiFlush();
}
```

#### 二、isFinal 时不强制覆盖（避免闪烁）

`audio_transcript.done` 收到的 `transcript` 通常 == 累积后的 delta。强制 setState 会触发不必要的重渲。

改为：**仅当 final 文本与当前累积差异显著（如长度差 > 0 或 trim 后不同）时才覆盖**：

```ts
if (isFinal) {
  // flush 任何 pending
  if (aiFlushRafRef.current != null) {
    cancelAnimationFrame(aiFlushRafRef.current);
    aiFlushRafRef.current = null;
  }
  if (sanitizedText.trim()) {
    const currentShown = currentAssistantDeltaRef.current.trim();
    const finalText = sanitizedText.trim();
    if (currentShown !== finalText) {
      setLatestAiLine(sanitizedText); // 仅在确实不同时覆盖
    }
    completedTranscriptRef.current = completedTranscriptRef.current
      ? `${completedTranscriptRef.current}\n${sanitizedText}`
      : sanitizedText;
    setTranscript(completedTranscriptRef.current);
  }
  currentAssistantDeltaRef.current = '';
  // ⚠️ 不清空 latestAiLine！让上一句继续显示，直到下一轮 delta 或用户开口
}
```

#### 三、新一轮 delta 到来时才清屏（消除停顿期空白）

旧逻辑：`isFinal=true` 时 `currentAssistantDeltaRef.current = ''` → 下一轮第一个 delta 时累积从 0 开始 → setLatestAiLine 第一个字 → 字幕从满屏长文瞬间变成"嗯"，视觉是「闪一下」。

修复：在 delta 分支判断"是不是新一轮的第一个 delta"（即 currentAssistantDeltaRef 刚被清空且 latestAiLine 还显示着上一句），如果是，**先把 latestAiLine 清空再追加**：

```ts
} else {
  // 新一轮第一个 delta：清空旧 AI 字幕（一次性）
  if (currentAssistantDeltaRef.current === '' && latestAiLineRef.current) {
    setLatestAiLine('');
  }
  currentAssistantDeltaRef.current += sanitizedText;
  // ...
}
```

需要新增 `latestAiLineRef` 镜像 state（避免闭包陈旧值）。

#### 四、清理副作用

- `endCall` / 用户开口分支增加 `cancelAnimationFrame(aiFlushRafRef.current)`
- 组件卸载 useEffect 增加 cleanup

### 涉及文件
- `src/components/coach/CoachVoiceChat.tsx`（仅改 `handleTranscript` 与新增 2 个 refs + 1 个 cleanup，约 30 行改动）

### 不动
- RealtimeAudio.ts、字幕 DOM、字体颜色、滚动容器、芯片、PTT、计费

### 验证
- [ ] AI 长段语音字幕按音节节奏推进，不再"一坨字突然出现"
- [ ] 句末 done 时光标/文字不闪烁
- [ ] 上一句结束后到下一句第一个字之间不出现"空白屏"，前一句留着直到新内容覆盖
- [ ] 用户按 PTT 说话仍立即清空 AI 字幕（语义优先）

