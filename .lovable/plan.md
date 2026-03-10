

# 安卓微信保存图片失败的根因与修复方案

## 问题分析

当前流程：
1. 用户点击"下载海报" → `handleDownload` 生成 Blob
2. `handleShareWithFallback` 检测到安卓 → 尝试 `navigator.share()`（Web Share API）
3. 如果 Web Share API 失败/取消 → fallback 显示 `ShareImagePreview`，传入 `blob:` URL
4. 用户在微信中长按 `blob:` URL 的图片 → **微信无法保存**

**根因**：微信安卓端的长按保存功能不支持 `blob:` 协议的图片 URL，只能保存 `https://` 远程图片。iOS 的 Safari WebView 对 `blob:` URL 有更好的支持，所以 iOS 能保存成功。

## 修复方案

将生成的 Blob 上传到 Storage 的 `partner-assets` bucket（已存在，public），获取 HTTPS 公开 URL 后传给 `ShareImagePreview`。

### 文件变更

| 文件 | 操作 |
|------|------|
| `src/utils/shareImageUploader.ts` | **新建** — 封装 Blob → 上传 Storage → 返回 HTTPS URL |
| `src/utils/shareUtils.ts` | **修改** — 在 WeChat/Android 的 preview 分支中先上传再回调 `onShowPreview` |

### 核心逻辑

```typescript
// shareImageUploader.ts
export async function uploadShareImage(blob: Blob): Promise<string> {
  const path = `temp-share/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const { error } = await supabase.storage
    .from('partner-assets')
    .upload(path, blob, { contentType: 'image/png' });
  if (error) throw error;
  const { data } = supabase.storage
    .from('partner-assets')
    .getPublicUrl(path);
  return data.publicUrl;
}
```

在 `shareUtils.ts` 的 WeChat H5、iOS、Android fallback 三个分支中：
```typescript
// 替换原来的 blob URL
const httpsUrl = await uploadShareImage(blob);
options.onShowPreview?.(httpsUrl);
```

这样微信长按保存的是 `https://` 图片，安卓和 iOS 都能正常保存。

### 清理

上传到 `partner-assets/temp-share/` 的临时图片可后续通过定时任务清理，暂不影响功能。

