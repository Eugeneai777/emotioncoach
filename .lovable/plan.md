
# 情绪教练测试问题评估与修复计划

## ✅ 已完成修复

| 编号 | 问题 | 状态 | 修复说明 |
|------|------|------|----------|
| 101 | 立即打卡跳转到错误页面 | ✅ 已修复 | `CampCheckIn.tsx` 中增加对 `emotion_diary_21` 类型的判断，明确跳转到 `/emotion-coach` |
| 102 | 分享显示"第0天" | ✅ 已修复 | `useStreamChat.ts` 中使用 `differenceInDays` 动态计算正确的天数 |
| 104 | 返回箭头切换到生活教练 | ✅ 已修复 | 同 101，路由跳转逻辑统一修正 |
| 105 | 情绪教练对话声音小 | ✅ 已修复 | `DoubaoRealtimeAudio.ts` 播放增益从 1.8 提升到 2.5 |
| 106 | 停顿时间太短 | ✅ 已修复 | `doubao-realtime-relay` VAD `vad_stop_time` 从 600ms 增加到 800ms |
| 108 | 有繁体字/日文字 | ✅ 已修复 | `doubao-realtime-token` Prompt 明确要求使用简体中文 |

## 🔄 待进一步观察

| 编号 | 问题 | 状态 | 说明 |
|------|------|------|------|
| 103 | 选择日期没有反应 | 🔄 | 可能与设备性能相关，`CampProgressCalendar.tsx` 代码结构正常 |
| 107 | 对话记录无法上拉 | 🔄 | `History.tsx` 已使用 `overflow-y-auto overscroll-contain` + `WebkitOverflowScrolling: touch` |

## 文件变更清单

| 文件路径 | 修改内容 |
|---------|----------|
| `src/pages/CampCheckIn.tsx` | 路由跳转逻辑增加 `emotion_diary_21` 判断 |
| `src/utils/DoubaoRealtimeAudio.ts` | 播放增益从 1.8 → 2.5 |
| `src/hooks/useStreamChat.ts` | campDay 使用 `differenceInDays` 动态计算 |
| `supabase/functions/doubao-realtime-relay/index.ts` | VAD `vad_stop_time` 600 → 800ms |
| `supabase/functions/doubao-realtime-token/index.ts` | Prompt 添加简体中文语言要求 |
