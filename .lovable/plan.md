
# 安卓微信"保存图片到手机失败"问题分析与修复

## 问题根因

从截图和代码可以清楚看出，用户在**安卓微信浏览器**中点击"生成分享图片"后，`shareImagePreview` 组件显示图片，然后用户点击"下载"按钮触发了 `handleDownload`，但微信浏览器拦截了这次下载操作，导致报 **"保存图片到手机失败"** 的错误。

### 具体问题链路

**步骤 1 - 图片生成（服务端）**：`XiaohongshuShareDialog` 调用 `generateServerShareCard` → Edge Function `generate-share-card` 返回 SVG → `svgToPngBlob` 在客户端用 Canvas 把 SVG 转成 PNG Blob

**步骤 2 - 显示 ShareImagePreview**：Blob 被转成 `blobUrl = URL.createObjectURL(blob)` → 展示在全屏的 `ShareImagePreview` 组件中

**步骤 3 - 用户点击下载按钮（失败点）**：
```typescript
// share-image-preview.tsx 第 72-83 行
const handleDownload = async () => {
  const response = await fetch(imageUrl); // 重新 fetch blobUrl
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `share-card-xxx.png`; // 微信不支持 <a download>
  link.click(); // ❌ 安卓微信忽略此操作，导致失败
};
```

**根本原因**：
1. **安卓微信不支持 `<a download>`**：微信内置浏览器屏蔽了通过 `<a>` 标签触发的文件下载
2. **下载按钮在安卓微信中出现了**：`share-image-preview.tsx` 里判断 `!isWeChat` 才显示下载按钮，但当前代码的 `isWeChat` 判断是组件内独立写的，**可能未覆盖所有微信 UA 变体**（比如安卓微信 UA 含 `MicroMessenger` 大写）
3. **移动端正确路径被跳过**：按照设计，安卓微信/iOS 用户应该看到**长按保存**提示，而非下载按钮；但从截图底部显示的是微信原生的失败 toast，说明用户看到了下载按钮并点击了它

### 代码中的 Bug

```typescript
// share-image-preview.tsx 第 17-18 行
const isWeChat = typeof navigator !== 'undefined' && 
  navigator.userAgent.toLowerCase().includes('micromessenger');
```

这个检测是正确的，但**下载按钮的条件是 `!isWeChat`**，意味着非微信平台才显示下载按钮。问题在于：

截图中底部显示的"保存图片到手机失败"是**微信系统的原生 toast**，不是应用内的 toast。说明用户**长按了图片**，然后微信尝试保存但失败了。

实际根本原因是：**`svgToPngBlob` 生成的图片 src 是 `data:image/svg+xml`，当微信浏览器尝试长按保存这张显示的 `<img>` 时，`src` 本身是一个 blob URL（`blob://...`）**，微信浏览器无法直接保存 blob URL 指向的图片。

### 真正的修复方案

需要将 `ShareImagePreview` 中 `<img>` 的显示方式从 `blob URL` 改为 **base64 data URL**，这样微信浏览器长按时可以直接保存 base64 图片。

## 修复计划

### 修改 1：`src/utils/serverShareCard.ts` — 新增 `generateServerShareCardDataUrl` 返回 data URL

将 `svgToPngBlob` 的结果通过 `FileReader` 转为 base64 data URL（此函数已存在，但 `XiaohongshuShareDialog` 没有使用它）。

### 修改 2：`src/components/wealth-block/XiaohongshuShareDialog.tsx` — 在安卓微信下使用 data URL 而非 blob URL

```typescript
// 现在的代码（有问题）
const blob = await generateServerShareCard({ ... });
if (blob) {
  const imageUrl = URL.createObjectURL(blob); // blob URL → 微信无法长按保存
  setServerPreviewUrl(imageUrl);
}

// 修改后
const isAndroidWeChat = /micromessenger/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent);
if (isAndroidWeChat) {
  // 使用 data URL，微信可以长按保存
  const dataUrl = await generateServerShareCardDataUrl({ ... });
  setServerPreviewUrl(dataUrl);
} else {
  const blob = await generateServerShareCard({ ... });
  if (blob) {
    setServerPreviewUrl(URL.createObjectURL(blob));
  }
}
```

### 修改 3：`src/components/ui/share-image-preview.tsx` — 修复 blob URL 清理逻辑

当使用 data URL 时，不需要调用 `URL.revokeObjectURL`，需要区分 url 类型。

## 技术细节

```text
问题流程（当前）：
SVG → svgToPngBlob → Blob → blob://xxx → <img src="blob://xxx"> → 
用户长按 → 微信尝试保存 blob:// URL → 失败（微信不支持 blob URL）

修复流程：
SVG → svgToPngBlob → Blob → FileReader → data:image/png;base64,... → 
<img src="data:image/png;base64,..."> → 用户长按 → 微信成功保存
```

## 影响范围

- 仅修改 3 个文件：`serverShareCard.ts`、`XiaohongshuShareDialog.tsx`、`share-image-preview.tsx`
- 不影响 iOS 和 PC 端的分享逻辑
- 其他分享卡片（SCL90、情绪健康等）使用 html2canvas 生成 blob URL，如有相同问题可后续一并修复
