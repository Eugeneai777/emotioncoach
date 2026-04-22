

## 优化 PTT 通话页配色 — 单一焦点、冷静背景

### 问题诊断
当前页面有三处配色冲突：
1. **背景过红**：`from-stone-950 via-rose-950/30 to-stone-950` 让整屏带粉灰雾感，沉闷压抑
2. **三个红撞色**：光球（rose-500）+ PTT 按钮（rose-500）+ 挂断按钮（red-500/20）三者颜色相同，视觉重心散乱
3. **光球光晕过大**：blur-2xl + opacity-25 把整个上半屏染成血红，吞噬了背景

顶级语音对话产品（ChatGPT Voice / Gemini Live / Siri）的统一做法：
- 背景**纯中性深色**（近黑或深蓝灰），完全无色彩污染
- 颜色只属于**唯一一个发声体（光球）**
- 其它操作按钮一律是**玻璃/中性灰**，不参与色彩竞争

### 改造方案 — `src/components/coach/CoachVoiceChat.tsx`

**1. 背景：去除玫红雾，改为冷静深空**
- `colors.deepBg.rose`：`from-stone-950 via-rose-950/30 to-stone-950` → `from-[#0B0D12] via-[#0F1218] to-[#0B0D12]`
- 整屏改为近黑偏冷的中性渐变，让光球的玫红成为屏上唯一的暖色

**2. 光球：缩小光晕影响范围、收敛色相**
- 外层 blur 光晕：`blur-2xl` → `blur-xl`，opacity 从 25/60 → 15/35，让玫红只在光球周围 1 个直径内有感，不再"血染半屏"
- 光球本体渐变改柔：`hsl(350 95% 78%)` → `hsl(350 85% 72%)`，降饱和约 10%，更高级
- 取消 idle 状态下的外层 blur 光晕动画（`pulse-slow`），只保留本体呼吸，减少弥漫感

**3. 挂断按钮：从红色 → 玻璃灰**
- 当前 `bg-red-500/20 text-red-400` → 改为 `bg-white/8 text-white/75 hover:bg-white/15 hover:text-white`，去掉图标背景的红色
- 挂断不再是"红色警告"，而是和顶栏融为一体的中性 chip
- 这样屏上只剩**光球 + PTT 按钮**两处玫红，焦点立即清晰

**4. PTT 按钮：保留玫红但收敛、与光球同源**
- `PushToTalkButton.tsx` 当前 `bg-rose-500`，改为更深的 `bg-rose-600` + 内层渐变 `from-rose-500 to-rose-700`，带轻微立体感
- 按下时（红色脉冲）保持现有逻辑
- 按钮本身仍是主操作（必须有色彩感），但比光球更深一档（rose-600 vs 光球 rose-400），形成"光球=声音、按钮=动作"的色阶层次

**5. 字幕颜色微调**
- AI 字幕 `text-rose-100` → `text-white/95`，让字幕回归"内容而非装饰"，符合 ChatGPT/Gemini 字幕一律用白色的惯例
- 用户字幕 `text-white/55` 保持不变

**6. 顶栏积分图标颜色降饱和**
- 8点的 `text-amber-400/90` → `text-amber-300/70`，更克制
- Coins 图标尺寸保持 w-3 h-3

### 改造后视觉层次

```
背景：冷黑（#0B0D12）— 完全无色
└─ 光球：柔和玫红，光晕收敛在小范围 — 唯一焦点
└─ 字幕：纯白 — 信息载体
└─ PTT 按钮：深玫红 — 唯一操作
└─ 顶栏 / 挂断：白色玻璃 — 系统级 chrome
```

### 涉及文件
- `src/components/coach/CoachVoiceChat.tsx`（colorMap.rose.deepBg、光球光晕参数、挂断按钮 className、AI 字幕颜色、积分颜色）
- `src/components/coach/PushToTalkButton.tsx`（按钮渐变背景）

### 不动
- 布局结构、PTT 录音逻辑、字幕逻辑、网络徽章逻辑、计费、连接流程
- 非 PTT 模式分支
- 其它教练（绿/蓝/紫等）的 colorMap

### 验证
- [ ] 屏幕背景为冷静深黑，无粉灰雾感
- [ ] 光球玫红仅在小范围光晕内，不再染整个上半屏
- [ ] 屏上只有光球和 PTT 按钮带玫红，挂断按钮变玻璃灰
- [ ] AI 字幕变纯白，可读性提升
- [ ] 整体观感接近 ChatGPT Voice / Gemini Live 的克制美学

