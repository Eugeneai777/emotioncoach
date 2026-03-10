

# 加速安卓手机保存 AI 海报

## 问题分析

安卓保存慢有三个瓶颈：

1. **快速模式 `PosterGenerator.tsx`**：缺少 `forceScale: 2`，且使用 `handleShareWithFallback` 串行上传后才显示预览
2. **上传阻塞预览**：`shareUtils.ts` 的 `showUploadedPreview` 必须等上传完成才显示图片
3. **下载文件名仍为 `.png`**：`share-image-preview.tsx` 下载时写死 `.png`

## 修改方案

### 1. `src/components/poster/PosterGenerator.tsx` — 快速模式对齐专家模式

`handleDownload` 改为 blob-first 模式（与 `PosterCenter.tsx` 的 `handleDownload` 一致）：
- 添加 `forceScale: 2`
- 去掉 `handleShareWithFallback`，改为先 `URL.createObjectURL` 立即预览，后台异步上传替换

### 2. `src/utils/shareUtils.ts` — `showUploadedPreview` 改为 blob-first

先用 `URL.createObjectURL` 立即回调 `onShowPreview`，然后后台上传，上传成功后再次回调替换 URL。避免等上传。

### 3. `src/components/ui/share-image-preview.tsx` — 下载文件名 `.png` → `.jpg`

```
link.download = `share-card-${Date.now()}.jpg`;
```

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/poster/PosterGenerator.tsx` | 加 `forceScale: 2`，改 blob-first 预览 |
| `src/utils/shareUtils.ts` | `showUploadedPreview` blob-first + 后台上传 |
| `src/components/ui/share-image-preview.tsx` | 下载文件名改 `.jpg` |

