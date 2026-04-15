
问题判断

- 这次问题不在“Blob 生成”或“异步上传到 HTTPS”本身，核心卡在“预览层还能不能触发原生长按保存”。
- `src/components/common/IntroShareDialog.tsx` 目前只是接入了 `handleShareWithFallback`，但没有真正对齐 `ShareDialogBase` 的生命周期：隐藏导出卡片还放在 `DialogContent` 里面，所以介绍弹窗不能安全地先关闭再开预览。
- 这样会导致移动端预览出现时，Radix Dialog 的 modal 交互锁仍可能残留，长按手势容易被拦住，尤其是 iPhone / 微信 / Android WebView。
- `src/components/ui/share-image-preview.tsx` 里图片本身还带着 `WebkitUserSelect: 'none'`、`userSelect: 'none'`，并且拦了 `contextmenu` 传播；这些都不利于 iOS/微信弹出“保存图片”的原生菜单。
- 我也对照了外部资料：Radix Dialog 的 body pointer lock / outside pointer-events 确实会影响 portal 弹层交互；而 iOS Safari / 微信里，给图片加 selection/callout 限制，经常会直接让长按保存菜单不弹。

修复方案

1. 修 `IntroShareDialog.tsx` 的弹窗生命周期
- 把隐藏导出卡片从 `DialogContent` 内移到 Dialog 外，做成和 `ShareDialogBase` 一样的持久隐藏导出容器。
- 在移动端“生成图片”流程里，先关闭介绍弹窗 `setOpen(false)`，再等 1-2 个 `requestAnimationFrame`，让 Radix 清掉遮罩和交互锁。
- 然后再生成 Blob 并进入预览，这样预览图片不再被底层 modal 干扰。
- 保持现有链路不变：仍然先显示 blob 预览，再异步升级到 HTTPS，可保存后再显示“长按保存”。

2. 修 `ShareImagePreview.tsx` 的图片可长按性
- 去掉图片上的 `WebkitUserSelect: 'none'` 和 `userSelect: 'none'`。
- 去掉 `onContextMenu` 的干预，让系统原生菜单自己弹。
- 保留 `WebkitTouchCallout: 'default'`，并确保图片本身是正常可交互的 `<img>`。
- 保留 `isRemoteReady` 逻辑：没切到 HTTPS 前继续提示“正在准备可保存图片…”，避免用户长按 blob 图无效。

3. 控制改动范围，避免影响现有功能
- 不改 `handleShareWithFallback` 的主流程。
- 不改分享入口、按钮文案、异步上传策略。
- 不动桌面端下载/分享逻辑。
- 只针对 `/xiaojin` 当前这条 `IntroShareDialog → ShareImagePreview` 路径做最小修复。

涉及文件
- `src/components/common/IntroShareDialog.tsx`
- `src/components/ui/share-image-preview.tsx`

验收标准
- iPhone 微信上：`/xiaojin` → 右上“分享给孩子” → “生成图片” → 等待就绪 → 长按图片，必须弹出系统保存菜单。
- Android 微信上同样验证一次。
- 同时回归检查：
  1. 预览还能先秒开，再自动切到 HTTPS；
  2. 关闭预览后没有残留遮罩/滚动锁；
  3. 桌面端保存与其他分享场景不受影响。

如果你批准，我就按这个最小改动方案实施。