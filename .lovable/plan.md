

# 微信全端分享链路统一修复

## 问题

从截图看，小程序端已能弹出原生操作面板（转发/保存/收藏），但实际操作失败。根因：

1. **`share-dialog-base.tsx` 第209-214行**：`showImagePreview=true` 时直接用 `URL.createObjectURL(blob)` 生成 `blob:` URL，**绕过了** `handleShareWithFallback` 的上传逻辑。微信 Android 无法长按保存 `blob:` URL。
2. **`share-image-preview.tsx` 第118行**：`!isWeChat` 条件隐藏了微信环境的下载按钮。
3. **移动端底部（第190-197行）**：只有"长按图片保存"文字提示，没有可靠的保存/转发按钮。

## 方案

### A. `src/components/ui/share-dialog-base.tsx`（第209-214行）

`showImagePreview` 分支改为调用 `handleShareWithFallback`，让它根据环境自动上传获取 HTTPS URL（微信/Android）或用 blob URL（其他）：

```typescript
if (showImagePreview) {
  if (loadingToastId) toast.dismiss(loadingToastId);
  await handleShareWithFallback(blob, fileName, {
    title: shareTitle,
    text: shareText,
    onShowPreview: (url) => {
      if (!isiOS) onOpenChange(false);
      setPreviewUrl(url);
      setShowPreview(true);
    },
  });
}
```

### B. `src/components/ui/share-image-preview.tsx`

**1. 移除 `!isWeChat` 限制**（第118行）— 所有环境都显示下载按钮。

**2. 移动端底部增加操作按钮**（第190-197行）：

- **微信环境**：「保存图片」按钮 + 「转发给朋友」按钮 + 返回
- **其他移动端**：「保存图片」按钮 + 返回
- **桌面端**：保持不变

**3. 新增 `handleForward` 函数**：
- fetch imageUrl → 转 File → `navigator.share({ files: [...] })`
- 失败时 toast 提示"请长按图片转发"

**4. 保留"长按图片保存"小字提示**作为辅助说明。

### C. 兼容性保证

| 环境 | 保存图片 | 转发给朋友 | 长按保存 |
|------|---------|-----------|---------|
| 微信小程序 | HTTPS URL → 下载按钮 | navigator.share | ✅ |
| 微信 H5 | HTTPS URL → 下载按钮 | navigator.share | ✅ |
| 电脑微信 | HTTPS URL → 下载按钮 | navigator.share | N/A |
| 手机浏览器 | blob URL → 下载按钮 | navigator.share | ✅ |
| 桌面浏览器 | blob URL → 下载按钮 | N/A | N/A |

所有移动端通过 `handleShareWithFallback` 统一走上传流程获取 HTTPS URL，确保跨端一致。

## 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/ui/share-dialog-base.tsx` | 第209-214行：用 `handleShareWithFallback` 替代直接 blob URL |
| `src/components/ui/share-image-preview.tsx` | 移除微信限制 + 移动端增加保存/转发按钮 |

