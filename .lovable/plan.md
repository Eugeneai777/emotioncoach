

## 三项优化

### 1. "免费"放入教练解说按钮内部，按钮变大

**文件：`src/components/wealth-block/AssessmentVoiceCoach.tsx`**

- 将按钮从 `w-20 h-20` (80px) 增大到 `w-24 h-24` (96px)
- 把外部的"免费"角标移到按钮内部，放在"教练解说"文字下方
- 按钮内部布局变为三行：图标 → "教练解说" → "免费"（绿色小字）
- 用完免费后，内部只显示图标 + "升级解锁"，无"免费"标签
- 删除按钮外部的独立"免费"span

```text
有免费次数时:
  ╔══════════╗
  ║    🎤    ║
  ║  教练解说 ║
  ║  [免费]  ║  ← 内嵌绿色小标签
  ╚══════════╝

用完后:
  ╔══════════╗
  ║    👑    ║
  ║  升级解锁 ║
  ╚══════════╝
```

### 2. 修复"开始测评"按钮点击无反应

**文件：`src/pages/WealthBlockAssessment.tsx`**（约第 831 行）

当前点击"开始测评"只调用 `setActiveTab("assessment")`，但如果已在 assessment tab 则无变化。

修复方案：点击时同时重置为初始状态（`setShowIntro(true)`），这样用户可以回到测评首页重新开始。

```text
改动前: onClick={() => setActiveTab("assessment")
改动后: onClick={() => { setActiveTab("assessment"); setShowIntro(true); }
```

### 3. 底部导航高度降低

**文件：`src/pages/WealthBlockAssessment.tsx`**（约第 828 行）

将底部导航栏的内边距从 `pt-1 pb-1` 改为 `pt-0.5 pb-0.5`，减少上下空白。同时将教练解说 FAB 的凸出量从 `-top-3` 调整为 `-top-4`，保持视觉突出效果。

