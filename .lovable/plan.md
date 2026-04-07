

# 修复身份绽放分享海报三大问题

## 问题分析

从截图可以看到三个问题：

1. **生成慢 + 重试**：截图1显示"正在优化清晰度后重试..."，说明首次生成失败触发了降级重试，总耗时翻倍
2. **长按保存失败**：WeChat Android 环境无法长按 blob: URL 保存图片。虽然代码有 `showUploadedPreview` 上传逻辑，但上传可能失败（需要登录/权限），导致回退到 blob URL
3. **点击保存提示跳转浏览器**：`handleDownload` 使用 `<a download>` 方式保存，WeChat 会拦截并提示"在浏览器打开"

## 改动方案

### 1. `src/components/ui/share-image-preview.tsx` — 微信环境优化保存逻辑

**核心改动**：微信环境下隐藏"保存图片"按钮（因 `<a download>` 不可用），改为显示醒目的"长按上方图片保存到相册"引导文案。非微信环境保持原逻辑不变。

```tsx
// WeChat: 隐藏下载按钮，显示长按引导
{isWeChat ? (
  <p className="text-base font-medium text-foreground">长按上方图片保存到相册</p>
) : (
  <Button onClick={handleDownload}>保存图片</Button>
)}
```

### 2. `src/components/ui/share-dialog-base.tsx` — 先显示再上传（PosterCenter 模式）

当前流程：生成 blob → 上传到 Storage 获取 HTTPS URL → 再显示预览。上传过程增加了等待时间。

**改为 PosterCenter 的"先显后传"模式**：
- 生成 blob 后立即用 blob URL 显示预览（毫秒级）
- 后台异步上传到 Storage，上传完成后静默替换为 HTTPS URL
- 这样用户能立即看到海报，长按保存在 HTTPS URL 替换后生效

修改 `handleGenerateImage` 中的 `showImagePreview` 分支（L240-246），不再等待上传完成才显示。

### 3. `src/utils/shareCardConfig.ts` — 降低首次生成失败率

IdentityBloomShareCard 是纯文本+渐变卡片（无复杂图片），但首次生成仍然失败。优化：
- 对于没有 `<img>` 标签的简单卡片，跳过图片等待阶段（节省 4-6 秒超时）
- 这个改动在 `waitForImages` 已有（images.length === 0 时直接 return），所以不需要改 shareCardConfig

实际上首次失败可能是空白检测误判。查看代码 L504-518，空白检测只采样左上角 10x10 像素——如果卡片顶部有 padding（IdentityBloomShareCard 顶部 28px padding），在 2x scale 下采样区域可能仍在 padding 区域内，被误判为空白。

**修复空白检测**：改为采样中心区域而非左上角 (0,0)。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/ui/share-image-preview.tsx` | 微信环境隐藏下载按钮，改为长按引导 |
| `src/components/ui/share-dialog-base.tsx` | 先显示 blob 预览，后台异步上传替换 |
| `src/utils/shareCardConfig.ts` | 空白检测改为采样中心区域 |

