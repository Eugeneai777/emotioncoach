

# 修复青少年邀请卡片生成图片过窄问题

## 问题分析

从截图可以看到两个问题：

1. **生成的图片本身非常窄** — 文字逐字换行（"Hey"、"测"、"试"各占一行），说明 html2canvas 捕获时卡片实际渲染宽度远小于 380px。原因：导出用的隐藏卡片放在 `fixed -left-[9999px]`，部分移动端浏览器会将屏幕外 fixed 元素的宽度压缩。
2. **ShareImagePreview 图片没有铺满屏幕** — img 标签有 `max-w-[420px]` 硬限制，在小屏手机上虽然够用，但由于生成的图片本身就窄（宽高比极端），显示出来自然也窄。

## 修改方案

### 1. `src/components/parent-coach/TeenInviteShareDialog.tsx`

在调用 `generateCardBlob` 时传入 `explicitWidth: 380` 强制指定捕获宽度，防止 html2canvas 读到压缩后的元素尺寸：

```typescript
const blob = await generateCardBlob(exportRef, { 
  isWeChat: isWeChatOrIOS(),
  explicitWidth: 380,
});
```

同时将隐藏导出卡片的容器改为使用 `min-width: 380px` 确保布局不被压缩：

```html
<div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', minWidth: '380px' }}>
```

### 2. `src/components/ui/share-image-preview.tsx`

将 img 的 `max-w-[420px]` 改为更宽的限制，让图片在移动端能填满可用宽度：

```
max-w-[420px] → max-w-full sm:max-w-[420px]
```

移动端去掉宽度上限，桌面端保持 420px 限制，与财富训练营分享页面一致。

### 涉及文件
- `src/components/parent-coach/TeenInviteShareDialog.tsx` — 传入 explicitWidth + 修复隐藏容器
- `src/components/ui/share-image-preview.tsx` — 移动端图片宽度铺满

