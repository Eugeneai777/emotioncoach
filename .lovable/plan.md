

# 修复：海报中心"下载海报"慢且长按无法保存

## 问题分析

PosterCenter 的 `handleDownload` 流程：
1. `generateCardBlob` 生成大尺寸海报（如 1080×1920）→ 慢
2. `handleShareWithFallback` → `showUploadedPreview` → 先上传到 Storage 获取 HTTPS URL → 再显示预览

整个流程是**串行**的：生成图片 → 上传到云端 → 才显示预览。大海报生成 + 上传双重耗时，用户体验差。

对比训练营邀请卡（正常工作）：卡片尺寸小，上传快。

## 修复方案

**核心思路：先显示 blob 预览（即时），后台上传，上传完成后替换为 HTTPS URL**

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/pages/PosterCenter.tsx` | `handleDownload` 改为先用 blob URL 显示预览，后台异步上传并替换 URL |
| `src/components/ui/share-image-preview.tsx` | 支持 `imageUrl` 动态更新（已支持，无需改） |

### PosterCenter.tsx `handleDownload` 改写逻辑

```typescript
const handleDownload = async () => {
  if (!posterRef.current) return;
  setIsDownloading(true);
  toast.loading('正在生成海报...');

  try {
    const blob = await generateCardBlob(posterRef, {
      explicitWidth: selectedPosterSize.width,
      explicitHeight: selectedPosterSize.height,
    });
    toast.dismiss();
    if (!blob) { toast.error('生成海报失败'); return; }

    // 1. 立即用 blob URL 显示预览（毫秒级）
    const blobUrl = URL.createObjectURL(blob);
    setPosterPreviewUrl(blobUrl);
    setShowPosterPreview(true);

    // 2. 后台上传，完成后替换为 HTTPS URL（安卓微信长按保存需要）
    import('./shareImageUploader').then(async ({ uploadShareImage }) => {
      try {
        const httpsUrl = await uploadShareImage(blob);
        setPosterPreviewUrl(httpsUrl);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.warn('Upload failed, keeping blob URL', e);
      }
    });
  } catch (error) {
    toast.dismiss();
    toast.error('保存失败，请重试');
  } finally {
    setIsDownloading(false);
  }
};
```

这样用户点击"下载海报"后：
- **立即**看到图片预览（blob URL，毫秒级）
- 后台静默上传到 Storage
- 上传完成后自动替换为 HTTPS URL → 安卓微信长按保存生效
- 即使上传失败，用户仍能看到图片

