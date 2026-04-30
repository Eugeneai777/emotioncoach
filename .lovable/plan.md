## 问题诊断

**问题 1：小程序端保存"完整报告"失败，电脑端正常**

当前"保存完整报告"流程：
1. 用 `html2canvas` 把 `MaleVitalityReportCard` 渲染成 blob
2. **直接** `URL.createObjectURL(blob)` 得到 `blob:` 链接
3. 把这个 `blob:` URL 塞进 `ShareImagePreview` 显示

为什么端口表现差异：
- **PC 浏览器**：`ShareImagePreview` 走「保存按钮」分支，`<a download>` 直接下载，blob URL 完全可用 ✅
- **小程序 / 微信 H5**：走「长按上方图片保存到相册」分支。微信内核的"保存到相册"**只识别 https 图片**，对 `blob:` URL 一律提示"保存图片到手机失败"（用户截图就是这个 toast）❌
- 而分享海报 (`handleShare`) 走的是 `executeOneClickShare` → `handleShareWithFallback`，**会异步上传到 storage 拿 https URL**，所以分享海报能保存，但"完整报告"路径没接这一步

底部那行"图片已生成，正在准备高清保存图"也是从 `ShareImagePreview` 来的 —— 它在等 `isRemoteReady=true`，而当前传入的是 false 且永不更新。

**问题 2：顶部文案"预览海报"**

`src/components/ui/share-image-preview.tsx:152` 写死了 `预览海报`，该组件被「分享海报」和「完整报告」两条路径复用。完整报告路径下应该显示"预览报告"。

---

## 修复方案

### 1. 让"完整报告"复用现成的"先 blob 占位 → 异步上传 → 替换 https"机制

抽取 `handleSaveAsImage` 的逻辑，对齐 `shareUtils.ts` 里 `showUploadedPreview` 的双阶段模式：

```text
生成 blob → 立即 setReportPreviewUrl(blobUrl, isRemoteReady:false) 显示预览
        ↓ 后台并发
        uploadShareImage(blob) → 拿到 https URL → setReportPreviewUrl(httpsUrl, isRemoteReady:true)
```

`ShareImagePreview` 已支持 `isRemoteReady` 字段并切换底部提示文案，无需改它的核心逻辑。

为此把 `reportPreviewUrl: string | null` 改成对象 `{ url, isRemoteReady } | null`，并在 `<ShareImagePreview>` 调用处传 `isRemoteReady`。关闭时只 revoke blob URL，不动 https URL。

失败兜底：上传失败时 keep blob URL，**额外 toast 提示**「网络较慢，建议先点右上角刷新或截屏保存」，避免用户卡在"正在准备高清保存图"状态。

### 2. 给 ShareImagePreview 加可选 `title` prop，调用处区分"预览海报"/"预览报告"

- `ShareImagePreview` 新增可选 `title?: string`，默认 `"预览海报"`
- 完整报告调用处传 `title="预览报告"`
- 分享海报调用处不传（保持原文案）

### 3. 其他端口稳定性兼带优化（成本低）

- **小程序 WebView**：与微信 H5 行为一致（已是 `isWeChatLike` → 都走"长按保存"分支），上传 https 后即可正常长按保存 ✅
- **PC / 移动浏览器**：当前已 OK，不动它的下载按钮分支
- **超时保护**：上传增加 8s 超时（用 `Promise.race`），超时后保留 blob URL 并提示用户「请尝试截屏保存或切换到 PDF」

---

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `src/components/ui/share-image-preview.tsx` | 新增 `title` prop（默认 `"预览海报"`），头部文案使用该 prop；新增 `isRemoteReady` 已有，无需改 |
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | `reportPreviewUrl` 状态改为 `{url, isRemoteReady}`；`handleSaveAsImage` 接入 `uploadShareImage` 双阶段；`<ShareImagePreview>`（报告路径）传 `title="预览报告"` 与 `isRemoteReady`；上传超时与失败兜底 toast |

不改：`shareImageUploader.ts`、`shareUtils.ts`、`MaleVitalityReportCard.tsx`、`WeChatPdfGuideSheet.tsx`、PDF 导出工具。

---

## 验收点

1. 微信小程序内：点「保存完整报告 → 保存为长图」→ 预览页底部从"正在准备高清保存图"在 1-3 秒内变为"高清图已准备好"→ 长按图片可正常保存到相册（不再提示失败）
2. 微信 H5（手机浏览器内）：同上，长按可保存
3. PC 浏览器：保留「保存图片」按钮，点击直接下载，行为与现状一致
4. 头部文案：完整报告预览页显示「预览报告」，分享海报预览页仍显示「预览海报」
5. 上传失败/超时：不会卡死，给出明确提示
