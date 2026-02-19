
# 修复苹果手机财富卡点分享：海报不居中 + 无法返回

## 问题根因

财富卡点测评的分享弹窗 `XiaohongshuShareDialog` 使用了自定义的 `onGenerate={handleServerGenerate}` 处理器。这导致 `ShareDialogBase` 中专门为 iOS 设计的优化逻辑被完全跳过：

```text
ShareDialogBase.handleGenerateImage()
  |
  +--> if (onGenerate) {      <-- 财富卡点走这条路
  |      onGenerate();         <-- 直接调用自定义函数，然后 return
  |      return;               <-- iOS 的提前关闭 Dialog 逻辑永远不会执行
  |    }
  |
  +--> // iOS 优化（提前关闭 Dialog、显示 loading toast）
       // 这段代码被跳过了！
```

结果：
1. iOS 上 Dialog 遮罩在图片生成期间一直存在，生成完后 `ShareImagePreview` 被遮罩盖住或与其冲突
2. Dialog 关闭时的 scroll lock 清理（100ms 延迟）与 `ShareImagePreview` 设置 `overflow: hidden` 产生竞争，导致滚动锁死

## 修复方案

修改 `src/components/wealth-block/XiaohongshuShareDialog.tsx` 中的 `handleServerGenerate` 函数，加入与 `ShareDialogBase` 相同的 iOS 优化逻辑：

1. 在 iOS 上先关闭 Dialog，显示 loading toast
2. 等待两帧确保 Dialog 关闭动画完成
3. 生成完成后正确 dismiss toast 并显示预览
4. 关闭预览时强制清理 scroll lock

## 技术细节

### 文件：`src/components/wealth-block/XiaohongshuShareDialog.tsx`

`handleServerGenerate` 函数改为：

```typescript
const handleServerGenerate = async () => {
  // iOS: 立即关闭 Dialog 避免遮罩冲突
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let loadingToastId: string | number | undefined;

  if (isiOS) {
    onOpenChange(false);
    loadingToastId = toast.loading('正在生成图片...');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  const blob = await generateServerShareCard({
    healthScore,
    reactionPattern,
    displayName: userInfo.displayName,
    avatarUrl: userInfo.avatarUrl,
    partnerCode: partnerInfo?.partnerCode,
    dominantPoor,
  });

  if (blob) {
    const imageUrl = URL.createObjectURL(blob);
    if (loadingToastId) toast.dismiss(loadingToastId);
    if (!isiOS) onOpenChange(false);
    setServerPreviewUrl(imageUrl);
    setShowServerPreview(true);
  } else {
    if (loadingToastId) toast.dismiss(loadingToastId);
    toast.error('图片生成失败，请重试');
  }
};
```

`handleCloseServerPreview` 加入 scroll lock 清理：

```typescript
const handleCloseServerPreview = () => {
  setShowServerPreview(false);
  if (serverPreviewUrl) URL.revokeObjectURL(serverPreviewUrl);
  setServerPreviewUrl(null);
  // 强制清理 scroll lock
  document.body.style.overflow = '';
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.paddingRight = '';
};
```

### 修改范围
- 仅修改 `src/components/wealth-block/XiaohongshuShareDialog.tsx` 一个文件
- `ShareDialogBase` 和 `ShareImagePreview` 无需改动
