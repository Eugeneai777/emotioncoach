

# 长按保存后显示"已保存"状态

## 问题

用户在安卓微信长按图片保存到相册后，底部状态文字仍显示"长按图片保存"，没有变为"已保存"反馈。

## 根因

浏览器没有原生事件能检测"用户通过长按菜单保存了图片"。当前代码只在 `handleDownload`（按钮点击）时设置 `imageSaved = true`，长按保存路径没有触发状态更新。

## 方案

通过监听 `contextmenu` 事件（长按触发的原生右键菜单事件）来启发式检测用户执行了长按保存操作。检测到后，延迟几秒（等待微信"请稍候..."完成），然后将状态切换为"已保存"。

### 修改文件：`src/components/ui/share-image-preview.tsx`

1. 在 `<img>` 的 `onContextMenu` 上，不再仅 `stopPropagation`，改为同时触发保存状态更新逻辑：
   - 当 `isImageReady`（HTTPS URL）时，设置一个 3 秒延时后 `setImageSaved(true)`
   - 底部状态文字根据 `imageSaved` 显示 "✅ 已保存到相册" 替代 "长按图片保存"

2. 底部状态逻辑变为三态：
   - `!isImageReady` → "⏳ 正在准备可保存图片..."
   - `isImageReady && !imageSaved` → "👆 长按图片保存 · 分享给好友"  
   - `imageSaved` → "✅ 已保存到相册"

