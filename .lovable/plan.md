

# 修复微信H5分享闪退问题

## 问题根因

当用户在微信浏览器（H5）中点击"分享我的AI测评报告"后：

1. `ShareDialogBase.handleGenerateImage` 被调用
2. `shouldUseImagePreview()` 只对小程序返回 true，微信H5返回 false
3. 进入 `handleShareWithFallback`，检测到 iOS + `navigator.share` 可用
4. 调用 `navigator.share()` — 但微信的 WebKit 实现有缺陷，share sheet 闪现后立刻关闭
5. `navigator.share()` 可能立刻 resolve（未真正完成分享），或抛出非 AbortError 的异常

代码注释已经指出了这个问题：*"WeChat's navigator.share() API is unreliable - it may resolve immediately"*，但实际逻辑并未针对微信H5跳过 `navigator.share`。

## 修复方案

### 文件：`src/utils/shareUtils.ts`

修改 `shouldUseImagePreview()` 函数，让微信H5也返回 true：

```typescript
export const shouldUseImagePreview = (): boolean => {
  const { isMiniProgram, isWeChat } = getShareEnvironment();
  // 微信环境（H5 和小程序）都使用图片预览
  // 因为微信的 navigator.share() 不可靠
  return isWeChat || isMiniProgram;
};
```

### 影响范围

`shouldUseImagePreview` 被 `share-dialog-base.tsx` 使用（第 105 行）。改动后：

- **微信H5**：跳过 `handleShareWithFallback`，直接生成图片并展示全屏预览（长按保存）
- **微信小程序**：行为不变（已经是图片预览）
- **iOS Safari / Android**：行为不变（继续用 `navigator.share()`）
- **桌面浏览器**：行为不变

### 同时修复 `handleShareWithFallback` 中的微信检测

作为双重保险，在 `handleShareWithFallback` 函数的 iOS 和 Android 分支中，增加微信环境的前置拦截。在函数开头（mini program 检测之后）添加：

```typescript
// WeChat H5: Skip navigator.share, show image preview
if (isWeChat && !isMiniProgram) {
  const blobUrl = URL.createObjectURL(blob);
  options.onShowPreview?.(blobUrl);
  return { success: true, method: 'preview', blobUrl };
}
```

这样即使其他调用方直接使用 `handleShareWithFallback`（不经过 `ShareDialogBase`），也不会触发微信的不可靠 share API。

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/utils/shareUtils.ts` | 1) `shouldUseImagePreview` 增加微信H5判断；2) `handleShareWithFallback` 增加微信H5前置拦截 |

## 预期效果

- 微信H5中点击分享 → 生成图片 → 全屏预览（提示"长按上方图片保存"）
- 不再出现闪屏/闪退
- 用户长按保存后可自行转发给微信好友
