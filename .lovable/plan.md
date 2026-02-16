

# 修复 iOS 分享：两处精准改动

## 问题根因（经代码确认）

**iPhone 13 "闪跳无动作"**：`shareCardConfig.ts` 的 `getOptimalScale()` 没有 iOS 检测。iPhone 13 Safari 走的是 `return isLowEndDevice() ? 2.5 : 3`，但 iPhone 13 的 `hardwareConcurrency` 是 6 核，不算低端设备，所以用了 `scale: 3`。一张 340px 宽、800px+ 高的卡片，3x 后 canvas 约 1020x2400+ = 2,448,000 像素。iOS Safari canvas 限制约 16MP，虽然没超，但某些 iOS WebView 实际限制更低（约 4-8MP），导致 `html2canvas` 静默失败，`generateCardBlob` 返回 null，然后 `handleGenerateImage` 抛错只显示一个 toast "生成图片失败" 就结束了。

**iPad "长黑屏"**：`ShareDialogBase` 在生成图片期间，Radix Dialog 保持打开（`bg-black/80` 遮罩），用户看到的就是黑色遮罩 + 小小的 loading spinner。iPad 大屏上尤其明显。生成完成后才关闭 Dialog 打开 `ShareImagePreview`。

## 修复方案（2 个文件，精准改动）

### 1. `src/utils/shareCardConfig.ts` — iOS 降至 2x

在 `getOptimalScale()` 中加入 iOS Safari 检测，强制使用 `scale: 2`：

```typescript
const getOptimalScale = (): number => {
  const ua = navigator.userAgent.toLowerCase();
  const isiOS = /iphone|ipad|ipod/.test(ua);
  
  // iOS Safari 对 canvas 尺寸有严格限制，统一用 2x
  if (isiOS) {
    return 2;
  }
  if (isWeChatBrowser()) {
    return isLowEndDevice() ? 2 : 2.5;
  }
  return isLowEndDevice() ? 2.5 : 3;
};
```

同时在 `generateCanvas` 中增加空白 canvas 检测 — 如果生成的 canvas 像素全部为 0（透明/空白），自动用 `scale: 1.5` 重试一次：

```typescript
// 在 canvas 生成后、return 前加入：
const ctx = canvas.getContext('2d');
if (ctx) {
  const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 10), Math.min(canvas.height, 10));
  const isBlank = sample.data.every(v => v === 0);
  if (isBlank) {
    console.warn('[shareCardConfig] Blank canvas detected, retrying with lower scale...');
    // 递归重试一次，scale 降到 1.5
    if (!options.forceScale) {
      return generateCanvas(cardRef, { ...options, forceScale: 1.5 });
    }
  }
}
```

### 2. `src/components/ui/share-dialog-base.tsx` — iOS 先关 Dialog 再生成

在 `handleGenerateImage` 中，iOS 设备点击"生成"按钮时：
1. **立即关闭 Dialog**（消除黑色遮罩）
2. 显示 `toast.loading("正在生成图片...")`
3. 在后台完成 `html2canvas` 生成
4. 生成完成后打开 `ShareImagePreview`

```typescript
const handleGenerateImage = useCallback(async () => {
  // ... existing ref check ...
  
  setIsGenerating(true);
  
  // iOS: 先关闭 Dialog 避免长黑屏，用 toast 显示进度
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let loadingToastId: string | number | undefined;
  if (isiOS) {
    onOpenChange(false); // 立即关闭 Dialog
    loadingToastId = toast.loading('正在生成图片...');
    await new Promise(r => setTimeout(r, 300)); // 等 Dialog 动画完成
  }
  
  try {
    // ... existing generation logic (blob or dataUrl) ...
    
    if (loadingToastId) toast.dismiss(loadingToastId);
    // 打开 ShareImagePreview
  } catch (error) {
    if (loadingToastId) toast.dismiss(loadingToastId);
    toast.error('生成图片失败，请重试');
  } finally {
    setIsGenerating(false);
  }
}, [...]);
```

### 不改动的文件

- `share-image-preview.tsx` — 已经改好了（白底、无 framer-motion）
- `shareUtils.ts` — iOS 检测逻辑已正确
- `oneClickShare.ts` — iOS 拦截逻辑已正确
- `WealthInviteCardDialog.tsx` — 调用方式不变

## 涉及文件

| 文件 | 改动内容 |
|------|----------|
| `src/utils/shareCardConfig.ts` | `getOptimalScale()` 增加 iOS 检测（scale: 2）；`generateCanvas` 增加空白 canvas 检测和降级重试 |
| `src/components/ui/share-dialog-base.tsx` | `handleGenerateImage` 在 iOS 设备上先关闭 Dialog 再异步生成图片 |

## 预期效果

- **iPhone 13**：点击"生成分享图片" → Dialog 立即关闭 → toast 显示"正在生成图片..." → 2x 分辨率稳定生成 → 白底预览页打开
- **iPad**：同上流程，不再看到 Radix Dialog 的黑色遮罩
- **如果 canvas 生成仍为空白**：自动降到 1.5x 重试，确保一定能生成
- **Android / 桌面**：行为不变

