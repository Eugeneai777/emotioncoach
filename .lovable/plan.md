
# 情绪教练测试问题评估与修复计划

## 问题清单分析

根据测试表格截图，以下是情绪教练相关的问题汇总：

| 编号 | 操作 | 结果 | 期望值 | 优先级 |
|------|------|------|--------|--------|
| 101 | 点 立即打卡，在情绪教练对话-开始对话 | 跳转到 有劲AI生活教练 对话页面 | 情绪教练AI对话 | 中 |
| 102 | 打卡页面，点 分享到社区，显示 | 第0天 | 第2天（对应第几天） | - |
| 103 | 选择日期 | 没有反应（iPhone14正常）太慢？ | - | 中 |
| 104 | 点下方<返回箭头 | 切换到 生活教练 | 情绪教练AI对话 | 中 |
| 105 | 情绪教练对话 | 声音小 | - | 中 |
| 106 | 对话 | 稍停顿就开始AI回复 | 停顿时间加长 | 中 |
| 107 | 对话记录 | 无法上拉 | - | 中 |
| 108 | 对话记录 | 有繁体字日文字 | - | 中 |

---

## 问题详细分析与修复方案

### 问题 101 & 104：立即打卡跳转错误教练页面

**根因分析**：
在 `CampCheckIn.tsx` 第 272-279 行，点击"开始对话"按钮时的跳转逻辑为：
```typescript
if (camp.camp_type === 'parent_emotion_21') {
  navigate(`/parent-coach?campId=${campId}`);
} else {
  navigate("/");  // 跳转到首页（情绪教练）
}
```

跳转到 `/` 是正确的（情绪教练首页），但用户反馈跳转到"有劲生活教练"。

**可能原因**：
1. 首页 `/` 确实是情绪教练，不应该跳转到生活教练
2. 可能是路由或状态问题导致页面重定向

**修复方案**：
1. 确认 `/` 路由指向 `Index.tsx`（情绪教练）
2. 检查是否有自动重定向逻辑干扰
3. 建议明确使用 `/emotion-coach` 路由而非 `/`

**文件变更**：
- `src/pages/CampCheckIn.tsx` - 将 `navigate("/")` 改为 `navigate("/emotion-coach")`

---

### 问题 102：分享到社区显示"第0天"

**根因分析**：
在 `CampShareDialog.tsx` 中，`campDay` 参数直接从调用方传入。问题可能出在调用方传递的 `campDay` 值为 0。

查看 `CampCheckInSuccessDialog.tsx`，它接收 `campDay` 并传递给 `CampShareDialog`。问题在于 `campDay` 的计算逻辑。

在 `Index.tsx` 第 614-626 行，`CampCheckInSuccessDialog` 的 `campDay` 来自 `checkInSuccessData.campDay`，这个值是在打卡成功时设置的。

**可能原因**：
- 训练营的 `completed_days` 字段未正确更新
- 打卡成功时传递的 `campDay` 未正确计算

**修复方案**：
1. 确保打卡成功时正确计算 `campDay` = `completed_days` 或基于日期差
2. 使用 `getDaysSinceStart()` 动态计算当前是第几天

**文件变更**：
- `src/hooks/useStreamChat.ts` 或相关打卡逻辑 - 修复 `campDay` 计算

---

### 问题 103：选择日期没有反应（某些设备慢）

**根因分析**：
日期选择器的响应问题可能与设备性能或组件渲染相关。需要排查：
1. 日期选择组件是否有性能瓶颈
2. 是否存在不必要的重渲染

**修复方案**：
1. 添加 `useMemo` 优化日期计算
2. 检查日历组件的虚拟化/优化
3. 添加加载状态反馈

**文件变更**：
- `src/components/camp/CampProgressCalendar.tsx` - 性能优化

---

### 问题 105：情绪教练对话声音小

**根因分析**：
在 `DoubaoRealtimeAudio.ts` 第 108-113 行，已有播放增益设置为 1.8 倍：
```typescript
this.playbackGainNode.gain.value = 1.8;
```

但用户仍反馈声音小，说明 1.8 倍增益不够。

**修复方案**：
1. 将播放增益从 1.8 提升到 2.5-3.0
2. 考虑添加用户可调节的音量控制

**文件变更**：
- `src/utils/DoubaoRealtimeAudio.ts` - 提升 `playbackGainNode.gain.value` 到 2.5

---

### 问题 106：稍停顿就开始AI回复（停顿时间太短）

**根因分析**：
在 `doubao-realtime-relay/index.ts` 第 399 行，VAD 停止时间设置为 600ms：
```typescript
vad_stop_time: 600,  // 缩短静音判定时间，更快响应
```

用户希望有更长的思考时间。

**修复方案**：
将 `vad_stop_time` 从 600ms 增加到 800-1000ms

**文件变更**：
- `supabase/functions/doubao-realtime-relay/index.ts` - 调整 `vad_stop_time: 800`

---

### 问题 107：对话记录无法上拉

**根因分析**：
对话记录页面可能存在滚动问题，需要检查：
1. `ScrollArea` 组件配置
2. 页面高度计算
3. iOS 弹性滚动兼容性

**修复方案**：
1. 添加 `overscroll-contain` 和 `-webkit-overflow-scrolling: touch`
2. 检查 `ScrollArea` 的高度约束

**文件变更**：
- `src/pages/History.tsx` 或相关对话记录组件 - 滚动优化

---

### 问题 108：对话记录有繁体字/日文字

**根因分析**：
这可能是 AI 模型输出的问题，或者是字体渲染问题。需要确认：
1. 数据库中存储的文本是否正确
2. AI 模型 prompt 是否强调使用简体中文

**修复方案**：
1. 在系统 prompt 中明确要求"使用简体中文，不使用繁体字或日文"
2. 检查现有数据是否需要清理

**文件变更**：
- `supabase/functions/doubao-realtime-token/index.ts` - 在 prompt 中添加语言要求
- 相关 AI 对话 Edge Functions - 统一添加简体中文要求

---

## 实施顺序

1. **高优先级**（影响核心流程）：
   - 问题 101/104：路由跳转修复
   - 问题 105：声音音量提升
   - 问题 106：VAD 停顿时间调整

2. **中优先级**（用户体验）：
   - 问题 102：campDay 显示修复
   - 问题 108：语言输出规范

3. **低优先级**（需进一步排查）：
   - 问题 103：日期选择器性能
   - 问题 107：滚动问题

---

## 预计文件变更清单

| 文件路径 | 修改类型 | 说明 |
|---------|----------|------|
| `src/pages/CampCheckIn.tsx` | 修改 | 路由跳转改为明确的 `/emotion-coach` |
| `src/utils/DoubaoRealtimeAudio.ts` | 修改 | 提升播放增益到 2.5 |
| `supabase/functions/doubao-realtime-relay/index.ts` | 修改 | 调整 vad_stop_time 到 800ms |
| `supabase/functions/doubao-realtime-token/index.ts` | 修改 | Prompt 添加简体中文要求 |
| `src/pages/History.tsx` | 修改 | 滚动容器优化 |
| 打卡成功相关逻辑 | 修改 | campDay 计算修复 |
