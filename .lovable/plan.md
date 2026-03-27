

# 分享按钮前置 + 海报下载性能优化

## 问题分析

### 问题 1：分享按钮太靠后
当前分享按钮在页面底部 CTA 区域下方（第1069行），是一个不起眼的灰色文字链接。用户需要滚动到页面最底部才能看到。

**方案**：在底部固定栏（sticky bottom bar，第1080行）中添加分享图标按钮，让用户随时可以点击分享，无需滚动到底部。

### 问题 2：电脑端下载慢
当前流程：点击"生成分享图片" → `html2canvas` 渲染卡片为 Canvas → 转 Blob → 下载。桌面端 `html2canvas` 使用 3.5x 分辨率（`getOptimalScale()` 返回值），对于包含多张教练照片的复杂卡片，渲染耗时较长。

**方案**：
- 桌面端降低渲染倍数为 2.5x（视觉差异极小但速度提升 ~40%）
- 生成过程中显示进度提示，改善等待体验

### 问题 3：多端保存兼容性
当前已有的兼容逻辑：
- **手机端（iOS/Android/微信）**：`shouldUseImagePreview()` 返回 true → 生成 blob URL → 全屏预览 → 引导长按保存 ✅
- **微信 Android**：上传到 Storage 获取 HTTPS URL（WeChat 无法长按保存 blob: URL）✅
- **桌面端**：尝试 Web Share API → 失败则 `<a download>` 自动下载 ✅

现有兼容逻辑基本完善，但 `share-image-preview.tsx` 的桌面端"保存图片"按钮（第63-82行）会重新 `fetch(imageUrl)` 再转 blob 下载——如果 imageUrl 是上传后的 HTTPS URL，这个 fetch 会多一次网络请求。可优化为直接使用已有的 blob。

## 具体改动

### A. `src/pages/SynergyPromoPage.tsx`
**底部固定栏添加分享按钮**（第1080-1114行区域）：
- 未购买状态：在"立即购买"按钮左侧添加分享图标按钮（Share2 icon）
- 已购买状态：在"进入训练营"按钮左侧添加分享图标按钮
- 按钮样式：`variant="outline"` 圆形图标按钮，不占用过多空间

### B. `src/utils/shareCardConfig.ts`
**降低桌面端渲染倍数**（第41-52行 `getOptimalScale`）：
- 标准浏览器（桌面端）：从 3/3.5x 降为 2.5/3x
- 移动端和微信保持不变

### C. `src/components/ui/share-image-preview.tsx`
**优化桌面端下载**（第63-82行 `handleDownload`）：
- 判断 imageUrl 是否为 blob: URL，如果是则直接使用，跳过 fetch 步骤
- 对 HTTPS URL 保持现有 fetch 逻辑（无法避免）

## 改动文件

| 文件 | 改动 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | 底部固定栏增加分享图标按钮 |
| `src/utils/shareCardConfig.ts` | 降低桌面端渲染倍数 |
| `src/components/ui/share-image-preview.tsx` | 优化 blob URL 下载路径 |

