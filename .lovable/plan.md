

# 修复 iPad/iPhone 13 分享卡片"长白屏"和底部显示异常

## 问题根因

从截图和代码分析，问题出在两个环节：

1. **隐藏卡片定位导致 iOS 尺寸计算错误**：导出卡片使用 `fixed -left-[9999px]` 定位在屏幕外，iOS Safari 对屏幕外元素的 `scrollWidth`/`scrollHeight` 计算不准确，导致 html2canvas 捕获了错误的区域大小（多出白色空间）。

2. **html2canvas 在 iOS 上捕获多余内容**：`generateCanvas` 依赖 `scrollHeight` 来确定渲染高度，iOS 返回的值偏大，导致生成的图片底部出现大面积白屏。底部的"AI教练解说"按钮等页面元素也可能被意外捕获。

## 修复方案

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/ui/share-dialog-base.tsx` | 改进隐藏卡片的 CSS 定位方式 |
| `src/utils/shareCardConfig.ts` | iOS 环境下使用显式尺寸、裁剪多余白边 |

### 1. 修复隐藏卡片定位（share-dialog-base.tsx）

将 `fixed -left-[9999px]` 改为 `visibility:hidden` + `overflow:hidden` + `height:0` 的方式隐藏：

```text
当前（有问题）:
  fixed -left-[9999px] top-0

改为:
  position: absolute
  overflow: hidden
  height: 0
  visibility: hidden (仅作用于外层容器)
  内部卡片保持 visibility: visible + position: absolute
```

这样卡片虽然在隐藏容器中，但其 DOM 布局计算仍然正确，iOS 不会返回错误的尺寸。

### 2. iOS 显式尺寸传递（shareCardConfig.ts）

在 `generateCanvasInternal` 中增加 iOS 特殊处理：
- 检测元素是否有显式的 inline `width` 样式（如 `320px`），优先使用该值而非 `scrollWidth`
- 对最终 canvas 进行白边裁剪检测：如果底部超过 20% 区域为纯色/空白，自动裁剪

### 3. onclone 回调加固

在 `onclone` 中为 iOS 强制设置 `overflow: hidden` 和 `maxHeight`，防止克隆后的元素在 iframe 中撑开多余高度。

### 技术细节

```text
share-dialog-base.tsx 隐藏容器改动:

<div 
  style={{
    position: 'absolute',
    overflow: 'hidden', 
    height: 0,
    width: 0,
    pointerEvents: 'none',
  }}
  aria-hidden="true"
>
  <div style={{ 
    position: 'absolute',
    visibility: 'visible',
    top: 0,
    left: 0,
  }}>
    {exportCard}
  </div>
</div>
```

```text
shareCardConfig.ts 关键改动:

1. 解析 inline width:
   const inlineWidth = originalElement.style.width 
     ? parseInt(originalElement.style.width) 
     : null;
   const elementWidth = explicitWidth || inlineWidth || scrollWidth;

2. iOS canvas 底部白边裁剪:
   if (isIOSDevice() && canvas) {
     const trimmed = trimBottomWhitespace(canvas, bgColor);
     if (trimmed) return trimmed;
   }

3. onclone 中限制高度:
   if (isIOSDevice()) {
     element.style.overflow = 'hidden';
     element.style.maxHeight = elementHeight + 'px';
   }
```

