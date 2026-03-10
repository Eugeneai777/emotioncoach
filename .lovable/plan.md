

# 修复：财富觉醒教练钻石背景改为红色

## 问题

`WealthCoachVoice.tsx` 传入 `primaryColor="amber"`，导致钻石 emoji 背景圆圈显示为黄色。用户希望显示为红色（rose），如第二张截图所示。

## 修复方案

将 `WealthCoachVoice.tsx` 中的 `primaryColor` 从 `"amber"` 改为 `"rose"`。

这会让 `CoachVoiceChat` 中的颜色映射使用 rose 配色：
- 头像圆圈：`bg-rose-500`（红色）
- 背景渐变：`from-stone-950 via-rose-950/30 to-stone-950`
- 光晕：`shadow-rose-500/30`

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/pages/WealthCoachVoice.tsx` | `primaryColor="amber"` → `primaryColor="rose"` |

一行改动即可。

