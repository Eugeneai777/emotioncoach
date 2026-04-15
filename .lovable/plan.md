

# 优化"生成图片"速度至 2 秒内

## 问题分析

当前 `generateCanvasInternal` 在生成前有多个串行等待：

1. **字体等待** `document.fonts.ready` — 最长 3 秒超时
2. **图片等待** `waitForImages` — 最长 4-6 秒超时
3. **渲染延迟** — 100-150ms
4. **UI 让步** — `requestAnimationFrame` + `setTimeout`

但在 `IntroShareDialog` 场景中，隐藏导出卡片（`exportRef`）已经在 DOM 中渲染完毕，字体和图片早已加载完成，这些等待完全是冗余的。

## 方案

仅修改 `src/components/common/IntroShareDialog.tsx`，在调用 `generateCardBlob` 时传入优化参数，不改动 `shareCardConfig.ts` 的通用逻辑。

### 具体改动

**文件：`src/components/common/IntroShareDialog.tsx`**

1. **传 `skipImageWait: true`** — 导出卡片已在 DOM 中，图片早已 loaded
2. **传 `forceScale: 2`** — 跳过 `getOptimalScale()` 检测开销，scale=2 已足够清晰且比默认值更快
3. **在 `handleGeneratePreview` 中，先检测字体是否已就绪**，若已就绪则利用一个小技巧：在 `generateCardBlob` 调用前提前标记（通过在外部先 `await document.fonts.ready` 并缓存结果），让内部的 3 秒超时不再阻塞

实际上最干净的做法是：`generateCardBlob` 已支持 `skipImageWait`，再加一个类似参数或直接利用现有的 `renderDelay` 控制。但为了不改通用模块，我在 `IntroShareDialog` 层面做预检：

```typescript
const generateBlob = async (): Promise<Blob | null> => {
  // ...existing check...
  const blob = await generateCardBlob(exportRef, { 
    isWeChat: shareEnv.isWeChat,
    skipImageWait: true,   // 新增：导出卡片已渲染，图片已加载
    forceScale: 2,         // 新增：固定 2x，跳过设备检测
  });
  // ...
};
```

同时在 `shareCardConfig.ts` 的 `generateCanvasInternal` 中增加一个 `skipFontWait` 选项（或复用 `skipImageWait` 扩展语义为 `skipPreflightWait`），跳过 `document.fonts.ready` 的 3 秒等待：

**文件：`src/utils/shareCardConfig.ts`**

1. `GenerateCanvasOptions` 增加 `skipFontWait?: boolean`
2. 当 `skipFontWait` 为 true 时，跳过 `document.fonts.ready` 等待
3. 当 `skipImageWait` 为 true 时，同时跳过 `renderDelay`（100-150ms），因为元素已稳定

### 预期效果

| 步骤 | 优化前 | 优化后 |
|------|--------|--------|
| 字体等待 | 0-3000ms | 跳过 |
| 图片等待 | 0-4000ms | 跳过 |
| 渲染延迟 | 100-150ms | 跳过 |
| UI 让步 | ~30ms | 保留 |
| html2canvas | 500-1500ms | 500-1000ms (scale 2 vs 2.5) |
| **总计** | 3-8s | **0.5-1.5s** |

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/utils/shareCardConfig.ts` | 增加 `skipFontWait` 选项 |
| `src/components/common/IntroShareDialog.tsx` | 传入 `skipImageWait`, `skipFontWait`, `forceScale` |

改动极小，不影响其他分享场景的默认行为。

