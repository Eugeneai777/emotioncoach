

# 修复：IntroShareDialog 安卓/小程序长按保存图片失效

## 问题根因

`IntroShareDialog`（用于青少年分享给孩子等场景）生成图片后直接使用 `data:` URL 显示预览，**没有上传为 HTTPS URL**，也没有传递 `isRemoteReady` 给 `ShareImagePreview`。

- 安卓/微信/小程序中，长按 `data:` URL 的 `<img>` 不会触发系统的"保存图片"菜单
- `ShareDialogBase` 已有正确实现：生成 blob → `handleShareWithFallback` → 异步上传 → 替换为 HTTPS URL → `isRemoteReady=true`

## 修复方案

**仅修改 `src/components/common/IntroShareDialog.tsx`**，将其图片生成+预览流程对齐 `ShareDialogBase` 的模式：

1. `handleGeneratePreview` 改用 `generateCardBlob`（生成 Blob）而非 `generateCardDataUrl`（生成 data URL）
2. 调用 `handleShareWithFallback`，利用其内置的 blob→HTTPS 异步上传链路
3. 新增 `isRemoteReady` 状态，传递给 `ShareImagePreview`
4. `onShowPreview` 回调会被调用两次：先 blob URL（即时显示），再 HTTPS URL（长按可保存）

## 影响范围

- 修复所有使用 `IntroShareDialog` 的分享场景（青少年小劲、SCL90、平台介绍、沟通教练等共 20+ 处调用）
- 不改变现有 UI 交互逻辑，仅修复底层图片生成链路
- `ShareDialogBase`、`ShareImagePreview` 等组件无需修改

