

## 修复计时器跳动过快

### 问题
`CoachVoiceChat.tsx` 第 834-836 行，当状态变为 `connected` 时直接创建新 `setInterval`，未清除可能已存在的旧计时器。若 `handleStatusChange('connected')` 被多次触发（断线重连等），多个计时器同时运行导致 `duration` 每秒增加多次。

### 修复
**文件：`src/components/coach/CoachVoiceChat.tsx`，第 834-836 行**

在 `setInterval` 前加一行 `clearInterval`：

```typescript
if (mappedStatus === 'connected') {
  lastActivityRef.current = Date.now();
  if (durationRef.current) clearInterval(durationRef.current); // 防止多个计时器叠加
  durationRef.current = setInterval(() => {
```

仅增加 1 行代码。

