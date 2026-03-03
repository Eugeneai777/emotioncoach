

# 已修复：分享卡片二维码不显示

## 问题根因

satori 将 `img` 元素的 `src` (data URL) 嵌入到 SVG `<image>` 元素中。客户端将该 SVG 作为 `data:image/svg+xml` 加载到 `<img>` 标签时，浏览器（尤其是 iOS/WebKit）出于安全原因会阻止加载嵌套的 data URL，导致二维码区域显示为空白。

## 修复方案

将二维码从 `img` 元素改为使用 `QRCode.create()` 获取原始矩阵数据，然后用 div 网格（flex row + cells）渲染每个模块，完全避免 data URL 嵌套问题。

## 修改文件

**`supabase/functions/generate-share-card/index.ts`**

- 新增 `generateQRElement()` 函数：使用 `QRCode.create()` 获取 QR 矩阵，渲染为 satori 兼容的 div 网格
- `createWealthCard` 和 `createWealthInfoCard` 改为接收 QR 元素而非 data URL
- 主处理函数改用 `generateQRElement()` 替代 `generateQRDataUrl()`
