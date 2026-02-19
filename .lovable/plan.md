

# 修复亲子教练邀请卡片和海报中心的分享/保存问题

## 问题分析

### 问题 1：亲子教练邀请卡片无法发给微信好友
**文件**: `src/components/parent-coach/TeenInviteShareDialog.tsx`

**根因**: 该组件没有使用统一的 `handleShareWithFallback`，而是自己实现了分享逻辑。在微信环境中，它会先尝试调用 `navigator.share()`，这个 API 在微信中不可靠——可能返回成功但实际并未完成分享。因此用户看到 "分享成功" 的提示，但卡片并未真正发出去。

### 问题 2：海报中心显示"已保存到相册"但相册里没有
**文件**: `src/components/poster/PosterGenerator.tsx`

**根因**: 该组件使用 `document.createElement('a').click()` 来触发下载，在微信浏览器中这种方式会被拦截（微信会提示"可在浏览器打开此网页来下载文件"），但代码仍然执行了 `toast.success("海报已保存到相册！")`，给用户造成已保存的错觉。

## 修复方案

### 修改 1：TeenInviteShareDialog.tsx
- 移除自定义的分享逻辑（lines 132-195）
- 改用统一的 `handleShareWithFallback` 函数
- 在微信/iOS 环境下直接展示图片预览（长按保存），不再尝试 `navigator.share`

### 修改 2：PosterGenerator.tsx
- 引入 `handleShareWithFallback` 和 `ShareImagePreview` 组件
- 在微信/iOS 环境下，不使用 `<a>` 标签下载，而是展示全屏图片预览，让用户长按保存
- 仅在实际下载成功（非微信环境）时才显示"已保存"提示

## 技术细节

### TeenInviteShareDialog 修改

```text
修改前（lines 132-195）：
  1. 调用 generateCardBlob 生成图片
  2. 尝试 navigator.share（微信中不可靠）
  3. 显示 "分享成功"（误报）
  4. 仅在 share 不可用时才回退到图片预览

修改后：
  1. 调用 generateCardBlob 生成图片
  2. 调用 handleShareWithFallback，自动处理：
     - 微信/iOS → 图片预览（长按保存）
     - Android → 尝试系统分享，失败回退图片预览
     - 桌面 → 尝试系统分享，失败回退下载
```

### PosterGenerator 修改

```text
修改前（lines 213-219）：
  1. 创建 <a> 标签触发下载
  2. 直接显示 "海报已保存到相册！"

修改后：
  1. 将 canvas 转为 Blob
  2. 调用 handleShareWithFallback：
     - 微信/iOS → 展示 ShareImagePreview（长按保存）
     - 其他环境 → <a> 标签下载
  3. 仅在实际下载成功时显示 toast
```

### 影响范围
- `src/components/parent-coach/TeenInviteShareDialog.tsx` — 重构分享逻辑
- `src/components/poster/PosterGenerator.tsx` — 添加微信环境的图片预览回退
