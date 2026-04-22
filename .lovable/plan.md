

## 让芯片在 AI 打招呼后继续显示

### 问题
当前 `VoiceSuggestionChips` 的显示条件是 `!latestUserLine && !latestAiLine`。AI 主动问候 1 秒后 `latestAiLine` 就有值了，芯片立即消失，用户根本来不及看清和点击。

### 修复方案 — `src/components/coach/CoachVoiceChat.tsx`

把芯片显示条件从「无任何字幕」改为「用户尚未开口」：

- **旧条件**：`status === 'connected' && !latestUserLine && !latestAiLine`
- **新条件**：`status === 'connected' && !latestUserLine`

逻辑含义：只要用户还没说过话（不管 AI 是否已经打招呼），芯片就一直保留作为"开口选项"。一旦用户按 PTT 说话或点了某个芯片（两者都会产生 `latestUserLine`），芯片才让位给字幕焦点。

### 效果
- AI 说"小明，又见面啦…上次聊到失眠，今天怎么样？" 时，下方 3 个芯片仍然显示
- 用户可以：① 直接按 PTT 回应 ② 点芯片切换话题 ③ 点"换个话题"展开抽屉
- 用户首次发言后，芯片自动隐藏

### 涉及文件
- `src/components/coach/CoachVoiceChat.tsx`（仅修改芯片渲染的条件判断，单行改动）

### 不动
- 芯片组件本身、缓存逻辑、抽屉、问候逻辑、PTT、字幕

