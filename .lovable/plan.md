

# 安卓长按保存慢/失败的修复方案

## 根因分析

当前流程：`handleDownload` → 生成 blob → 立即显示 `blob:` URL 预览 → 后台上传替换为 HTTPS URL。

**核心问题**：安卓微信浏览器**无法长按保存 `blob:` 协议的图片**。用户看到图片后立即长按，此时后台上传尚未完成，图片仍是 `blob:` URL，导致保存失败或超时。

## 修复方案（3个文件）

### 1. `src/components/ui/share-image-preview.tsx` — 区分"准备中"和"可保存"状态

- 检测 `imageUrl` 是 `blob:` 还是 `https:`
- `blob:` 状态时：底部显示 "⏳ 正在准备可保存图片..." + 加载动画，**同时显示"保存图片"按钮**（programmatic download 对 blob URL 有效）
- `https:` 状态时：底部显示 "✅ 长按图片保存 · 分享给好友"
- 移动端也显示"保存图片"按钮（不依赖长按，用编程方式 `<a download>` 触发保存）

### 2. `src/components/poster/PosterGenerator.tsx` — 等上传完成再更新预览

当前 `handleDownload` 的后台上传逻辑正确，无需大改。但需要确保 `setPreviewImageUrl(httpsUrl)` 能触发预览组件重新渲染，当前已满足。

### 3. `src/utils/oneClickShare.ts` — `showUploadedPreview` 对齐 blob-first

`oneClickShare.ts` 中的 `showUploadedPreview`（被"一键分享"按钮使用）目前仍是**串行等待上传**后才回调 `onShowPreview`。改为：先用 blob URL 回调，后台上传完成后再次回调替换。

## 关键改动

| 文件 | 改动 |
|------|------|
| `share-image-preview.tsx` | 增加 blob/https 状态检测，移动端显示"保存图片"按钮，显示上传进度提示 |
| `oneClickShare.ts` | `showUploadedPreview` 改为 blob-first + 后台上传（与 PosterGenerator 对齐） |
| `PosterGenerator.tsx` | 微调：无重大改动，已是 blob-first |

## 用户体验改善

**改前**：长按 → 卡住/失败（blob URL 不可保存）→ 用户困惑
**改后**：
1. 图片立即显示（blob URL）
2. 底部提示"正在准备..." + 显示"保存图片"按钮（可立即点击下载）
3. 上传完成后提示变为"长按图片保存"
4. 两种保存方式都可用：按钮下载 + 长按保存

