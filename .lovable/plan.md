
# 根因分析：/wealth-block 分享卡片白屏与卡顿问题

## 问题现象（截图对照）

用户截图显示：打开分享弹窗后，页面大面积白屏（约占屏幕70%以上），卡片只显示在底部一小段，且屏幕卡住无法交互。

---

## 核心差异：两个页面的分享机制完全不同

```text
/wealth-camp-intro（正常）           /wealth-block（有问题）
─────────────────────────────────   ──────────────────────────────────
纯静态营销页面                         交互式测评结果页（791行）
无分享卡片弹窗                         有 WealthInviteCardDialog 弹窗
无 html2canvas 调用                   使用 html2canvas 生成截图
无 Framer Motion 复杂动画              全页面大量 motion.div 动画
无 Recharts 图表                       内嵌 RadarChart + BarChart
无 Dialog 叠层                        Dialog 内嵌分享弹窗
```

`/wealth-camp-intro` 根本不存在分享卡片弹窗，因此完全不会触发这个问题。

---

## 具体技术根因（3层叠加问题）

### 根因 1：html2canvas 在 iOS/WeChat 捕获大型复杂 DOM（最主要）

`WealthBlockResult.tsx` 是一个约 791 行、包含以下复杂组件的结果页：
- `EnhancedHealthGauge`（gauge 仪表盘）
- `EnhancedFourPoorRadar`（Recharts RadarChart）
- `BarChart`（Recharts 柱状图）
- `AwakeningJourneyPreview`（多卡片布局）
- `WealthAdvisorQRCard`（二维码）
- 大量 `framer-motion` 的 `motion.div` 动画

`ShareDialogBase` 中的隐藏导出容器代码：
```tsx
// 位于 share-dialog-base.tsx 第358-376行
<div style={{ position: 'absolute', overflow: 'hidden', height: 0, width: 0 }}>
  <div style={{ position: 'absolute', visibility: 'visible', top: 0, left: 0 }}>
    {exportCard}   // ← AssessmentValueShareCard 渲染在这里
  </div>
</div>
```

这个隐藏容器虽然 `height: 0`，但其中的 `AssessmentValueShareCard` 的 DOM 实际存在并被实时渲染。当用户点击"生成图片"，`html2canvas` 会：
1. 等待字体加载（最多 3000ms）
2. 等待图片加载（WeChat 最多 6000ms）
3. 渲染稳定延迟（150ms）
4. 克隆整个 `window` 环境创建 iframe
5. 在 iframe 中重新渲染并截图

**总耗时在 iOS/WeChat 上可长达 8-15 秒**，主线程完全被阻塞。

### 根因 2：iOS Dialog 关闭时序问题

`share-dialog-base.tsx` 第 175-181 行：
```typescript
const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
if (isiOS) {
  onOpenChange(false); // 立即关闭 Dialog
  loadingToastId = toast.loading('正在生成图片...');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}
```

iOS 路径：Dialog 先关闭 → html2canvas 才开始工作。但 Dialog 关闭触发 Radix UI 的 `data-scroll-locked` 属性，页面 `overflow: hidden`。此时：
- 页面被滚动锁定（视觉上是白屏大面积）
- 后台 html2canvas 占满 CPU，无法更新 UI
- 用户看到白屏 + 冻结，实际上是 Toast 在 Dialog 关闭后失去载体

### 根因 3：Radix Dialog scroll-lock 清理时机不当

`share-dialog-base.tsx` 第 114-121 行：
```typescript
} else {
  const timer = setTimeout(() => {
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.overflow = '';
  }, 100);
}
```

清理只在 Dialog `open` 变为 `false` 时执行，但 iOS 路径下 Dialog 关闭后 html2canvas 还在运行（最长15秒），这 15 秒内 scroll-lock 可能被 Radix 多次重新设置，导致白屏持续整个生成过程。

---

## 为什么训练营分享（/wealth-camp-checkin）没有问题？

`WealthInviteCardDialog` 在训练营页面打开时是 `defaultTab="camp"`，卡片内容是 `WealthCampShareCard`——一个纯 div + 静态文字的轻量卡片，没有图表、没有 Recharts，html2canvas 捕获速度快（约 1-2 秒）。

而 `/wealth-block` 的分享同样使用 `WealthInviteCardDialog`（`defaultTab="value"`），但 `AssessmentValueShareCard` 本身虽然简单，问题不在卡片本身，而在于：
- **整个页面 DOM 已经很复杂**（Recharts + MotionDiv）
- html2canvas 克隆的是 `window` 级别的 DOM 环境

---

## 修复方案（计划）

### 方案：为 /wealth-block 切换到服务端渲染 SVG→PNG 路径（已有基础设施）

项目中已经存在 `src/utils/serverShareCard.ts` 和 edge function `generate-share-card`，这是**绕过 html2canvas 的最佳方案**。

#### 修改点

**1. 修改 `WealthInviteCardDialog.tsx`**

当 `defaultTab="value"` 且 `assessmentScore` 已知时，提供 `onGenerate` 回调给 `ShareDialogBase`，调用 `generateServerShareCard()` 而不是 html2canvas：

```typescript
// 在 WealthInviteCardDialog 中
const serverOnGenerate = activeTab === 'value' && assessmentData
  ? async () => {
      const blob = await generateServerShareCard({
        healthScore: assessmentData.awakeningScore,
        reactionPattern: assessmentData.reactionPattern,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        partnerCode: partnerInfo?.partnerCode,
      });
      // 展示预览图
    }
  : undefined;
```

**2. 修改 `ShareDialogBase.tsx`**

改善 iOS scroll-lock 清理：在 html2canvas 生成**完成后**（无论成功失败）强制清理 scroll-lock，而不仅仅在 Dialog 关闭时清理：

```typescript
} finally {
  setIsGenerating(false);
  // 强制清理 scroll-lock（防止白屏遗留）
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.overflow = '';
}
```

**3. 为 value tab 禁用 iOS 提前关闭 Dialog 的逻辑**

服务端生成速度快（约 1-2 秒），不需要 iOS 特殊路径，直接在 Dialog 内显示进度即可。

#### 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 当 tab=value 时使用 `generateServerShareCard` 替代 html2canvas |
| `src/components/ui/share-dialog-base.tsx` | finally 块中强制清理 scroll-lock |
| `supabase/functions/generate-share-card/index.ts` | 确认 SVG 模板包含 AssessmentValueShareCard 的样式 |

---

## 预期效果

| 指标 | 修复前 | 修复后 |
|------|-------|-------|
| 生成时间 | 8-15秒（iOS/WeChat） | 1-2秒 |
| 白屏时长 | 整个生成期间 | 0 |
| 主线程阻塞 | 是（html2canvas） | 否（异步fetch） |
| WeChat 兼容性 | 不稳定 | 稳定（Base64输出） |

