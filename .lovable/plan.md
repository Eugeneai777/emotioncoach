
# 修复分享卡片在 iPhone 13/iPad 上的"长黑屏"问题

## 问题分析

当用户在 iOS Safari 上点击分享按钮后：
1. 系统调用 `navigator.share()` 打开系统分享面板
2. 用户选择"微信" → 微信打开 → 但分享可能失败（非 AbortError）
3. 回到应用后，代码进入 fallback 路径，打开 `ShareImagePreview` 组件
4. `ShareImagePreview` 是一个全屏 `bg-black/95` 遮罩，图片用 `max-h-[70vh]` 约束

在 iPad 等大屏设备上，320px 宽的卡片图片被缩小显示在巨大的黑色背景中，视觉上就是"非常长的黑屏需要找卡片"。

另一个可能：iOS Safari 的 `navigator.share()` 成功返回后，WeChat 内部处理分享时出现异常，但 Promise 已 resolve，用户看到的黑屏可能来自 WeChat 自身的渲染问题。

## 修复方案

### 1. iOS Safari 也优先使用图片预览（跳过不可靠的 navigator.share）

**文件**: `src/utils/shareUtils.ts`

修改 `shouldUseImagePreview()` 和 `handleShareWithFallback()`，让 iOS 设备也直接使用图片预览模式，因为：
- iOS Safari 的 `navigator.share()` 调用微信时行为不可预测
- 图片预览模式（长按保存）在所有 iOS 环境中都稳定工作

```typescript
export const shouldUseImagePreview = (): boolean => {
  const { isMiniProgram, isWeChat, isIOS } = getShareEnvironment();
  // iOS 和微信环境都使用图片预览
  // iOS Safari 的 navigator.share() 调微信时不可靠
  return isWeChat || isMiniProgram || isIOS;
};
```

### 2. 优化 ShareImagePreview 在大屏上的显示

**文件**: `src/components/ui/share-image-preview.tsx`

- 将图片 `max-h-[70vh]` 改为 `max-h-[80vh]`，让卡片占据更多屏幕空间
- 在图片外层添加浅色半透明背景衬底，减少纯黑视觉感
- 确保图片在 iPad 大屏上也居中且足够大

```tsx
<img
  src={imageUrl}
  alt="分享卡片"
  className={`max-w-[90%] max-h-[80vh] object-contain rounded-xl shadow-2xl ${
    imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
  }`}
/>
```

### 3. oneClickShare.ts 同步修复

**文件**: `src/utils/oneClickShare.ts`

在 iOS 分支之前添加 iOS 检测，跳过 `navigator.share()`：

```typescript
// iOS: Skip unreliable navigator.share, show image preview
if (env.isIOS && !env.isWeChat) {
  onProgress?.('preview');
  onShowPreview?.(blobUrl);
  onSuccess?.();
  return true;
}
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/utils/shareUtils.ts` | `shouldUseImagePreview` 增加 iOS 判断；`handleShareWithFallback` 增加 iOS 前置拦截 |
| `src/components/ui/share-image-preview.tsx` | 图片约束从 70vh 改 80vh，宽度约束从 full 改 90%，优化大屏显示 |
| `src/utils/oneClickShare.ts` | iOS 分支也跳过 navigator.share，使用图片预览 |

## 预期效果

- iPhone 13 / iPad 上点击分享 → 直接生成图片 → 全屏预览（提示"长按保存"）
- 不再出现系统分享面板跳转微信后的闪退/黑屏
- 图片在 iPad 大屏上居中显示，占据 80% 视口高度，不再"找卡片"
