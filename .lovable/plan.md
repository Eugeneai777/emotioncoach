
# 修复安卓手机分享图片预览的三个问题

## 问题根因

### 问题 1：无法返回
**根因**：`ShareImagePreview` 底部的两个"返回"按钮（第 191 行和第 209 行）直接调用 `onClose`，而不是 `handleClose`。`handleClose` 包含 `cleanupScrollLock()` 逻辑（清除 body 上的 `overflow: hidden` 和 `data-scroll-locked`），直接调用 `onClose` 会跳过这个清理步骤，导致页面滚动被锁死。

### 问题 2：海报未居中全屏 / 需要滚动
**根因**：在非 WeChat、非 iOS 环境（即安卓）下，底部操作区显示"保存图片"大按钮 + "返回"按钮，占用较多空间。加上图片区域的 `overflow-auto`，在部分安卓机型上会出现滚动。

### 问题 3：保存图片失败
**根因**：安卓上的 `handleDownload` 使用 `document.createElement('a').click()` 触发下载，这在安卓内置浏览器（微信、部分厂商浏览器）中会被拦截，导致下载失败。当前错误提示为"下载失败，请长按图片保存"，但底部没有引导用户长按的提示。

## 修改方案

### 修改文件：`src/components/ui/share-image-preview.tsx`

#### 修复 1：底部按钮调用 handleClose
将第 191 行和第 209 行的 `onClick={onClose}` 改为 `onClick={handleClose}`，确保关闭时正确清理滚动锁。

#### 修复 2：安卓也走长按保存路径
将底部操作区的条件判断从 `isWeChat || isIOS` 扩展为 `isWeChat || isIOS || isAndroid`（即所有移动端），安卓用户也看到"长按上方图片保存"的引导提示，而非不可靠的下载按钮。

#### 修复 3：改进下载失败的回退逻辑
在 `handleDownload` 失败时，提示更清晰的"请长按图片保存"。

### 技术细节

```text
修改前（第 180 行条件）：
  if (isWeChat || isIOS) → 显示长按提示
  else → 显示"保存图片"按钮

修改后：
  添加 isAndroid 检测
  if (isWeChat || isIOS || isAndroid) → 显示长按提示
  else → 显示"保存图片"按钮（仅桌面端）

修改前（第 191、209 行）：
  onClick={onClose}

修改后：
  onClick={handleClose}
```

### 影响范围
- 仅修改 `src/components/ui/share-image-preview.tsx` 一个文件
- 该组件被 15+ 个功能使用，修复后全部受益
