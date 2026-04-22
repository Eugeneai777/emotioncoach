

## 替换中央红圈 + 接通后 AI 主动问候 + 智能场景提示

### 当前问题
1. **中央光球与底部 PTT 按钮颜色一致**（都是 rose-500 红圈），视觉上重复，光球失去独立意义
2. **接通后是死寂**，没有 AI 主动开口，用户不知道做什么
3. **空白字幕区只显示一行灰字提示**，浪费了视觉空间

### 改造方案

#### 一、把中央"红圈"替换为「呼吸频谱波纹」(Breathing Waveform)

参考 ChatGPT Voice / Siri / Apple Intelligence 的处理：中心元素不应该是"按钮的复制品"，而应该是**抽象的声音可视化**。

**新视觉**：
- 移除 rose 实心圆球
- 改为**3 条横向流动的细线波纹**（gradient stroke），状态驱动颜色与振幅：
  - `idle`：3 条灰白细线缓慢横向呼吸（amplitude 微小，opacity 30%）
  - `assistant-speaking`：玫红渐变线条按音节起伏（amplitude 大，流动动画）
  - `user-speaking`：青蓝渐变线条向中心收敛（emerald-400）
- 用 SVG path + CSS 动画实现，无第三方库，整体高度仅 80px
- 颜色与底部 PTT 按钮**完全脱钩**：PTT 仍是红色（动作语义），中央波纹是冷色基调（声音可视化语义），消除重复感

#### 二、接通后 AI 主动用用户名打招呼

**改造位置**：`src/components/coach/CoachVoiceChat.tsx` 连接成功 (`status === 'connected'`) 后

1. 从 `profiles` 表读取 `nickname / display_name`（fallback 到「朋友」）
2. 检查是否有历史对话（查 `emotion_briefings` 或 `conversation_logs` 最近 7 天）：
   - **首次/无记忆**："{nickname}，我在呢，今天想聊点什么？"
   - **有历史**："{nickname}，又见面啦。上次我们聊到{最近主题}，今天感觉怎么样？"
3. 通过 `chatRef.current.sendTextMessage(greeting)` 主动触发 AI 用语音说出（已有现成机制，AI 来电模式就在用）
4. 仅在非 `isIncomingCall` 模式下注入（来电模式有自己的 openingMessage）

#### 三、智能场景提示芯片 (Suggestion Chips)

替换字幕区空闲态的"按住下方按钮·和教练说说"灰字。

**布局**：在波纹下方、PTT 按钮上方，渲染 3 个**横向滚动的小芯片**（玻璃质感，rounded-full，px-4 py-2）：

```
┌────────────────────────────────────────────┐
│  [≈≈≈ 波纹 ≈≈≈]                            │
│                                            │
│  💭 最近睡不好    🌊 工作压力大    💛 想聊聊关系  │ ← 滚动
│                                            │
│  「按住下方说话」                          │
│                                            │
│  [PTT 按钮]                                │
└────────────────────────────────────────────┘
```

**芯片来源（智能分级）**：
- **有历史对话**：从最近 5 条 `emotion_briefings.emotion_theme` 取 top 3，例如「继续聊：失眠」「回顾：工作焦虑」「跟进：和妈妈的对话」
- **无历史**：用静态推荐池随机 3 条（睡不好 / 工作压力 / 关系困扰 / 自我怀疑 / 没动力 / 想被看见）
- **正在对话中**（已有 latestUserLine）：芯片消失，让位字幕

**点击行为**：
- 点击芯片 = 直接通过 `sendTextMessage` 把该话题作为用户发言发给 AI，AI 立即开口回应
- 等价于"语音说出该话题"，省去用户思考"我该说什么"

#### 四、字幕区视觉微调

- 用户字幕从 `text-white/55` 提升到 `text-white/65`，缩短前置等待感
- AI 字幕保留 `text-white/95`，光标动画从 rose-200 改为 rose-300/80（与新波纹色阶呼应）

### 改造后视觉层次

```
┌─ 顶栏：返回 · 时长 · 余额 · 挂断（玻璃灰）
│
│         ≈≈≈≈≈≈≈≈≈≈           ← 新：3 条流动波纹（替代红球）
│         ≈≈≈≈≈≈≈≈≈≈
│
│         {AI 字幕：白色，是焦点}
│         {用户字幕：浅灰}
│
│    [💭 失眠]  [🌊 压力]  [💛 关系]   ← 新：智能场景芯片（仅空闲）
│
│
│              ●  ← PTT 红按钮（唯一红色，动作语义清晰）
│           按住说话
└──────────────────────────────
```

### 涉及文件

- `src/components/coach/CoachVoiceChat.tsx`：
  - 用 `<VoiceWaveformVisualizer />` 替代当前 PTT 模式光球 div（lines ~2160-2206）
  - 新增 `useEffect` 监听 `status === 'connected'` 且非来电模式 → 拉取 nickname + 最近主题 → `sendTextMessage(greeting)`
  - 新增 `<SuggestionChips />` 区块在字幕区上方
- 新建 `src/components/coach/VoiceWaveformVisualizer.tsx`（SVG 波纹组件，接收 `state: 'idle' | 'user' | 'assistant'` 与 `colorTheme`）
- 新建 `src/components/coach/VoiceSuggestionChips.tsx`（智能芯片组件，接收 `userId`、`onPick(text)`、`primaryColor`）
- 新建 `src/hooks/useVoiceGreeting.ts`：封装"取昵称 + 取最近主题 + 拼接问候语"逻辑

### 不动

- PTT 按钮本体颜色与逻辑（保持红色作为唯一动作色）
- 计费、连接、字幕、网络徽章
- 非 PTT 模式分支
- AI 来电（isIncomingCall）的 openingMessage 注入逻辑

### 验证

- [ ] 中央不再是红圈，而是冷色调流动波纹，与底部红按钮形成"声音/动作"两级
- [ ] 接通 1 秒内 AI 主动用昵称打招呼（"小明，我在呢…"）
- [ ] 二次接通时 AI 提到上次话题（"上次我们聊到失眠，今天怎么样？"）
- [ ] 空闲态显示 3 个可点击场景芯片，点击即触发 AI 回应
- [ ] 一旦开始说话，芯片消失，字幕成为唯一焦点

