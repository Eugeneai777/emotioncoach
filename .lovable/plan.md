

# 修复：分享图片预览被页面固定元素遮挡

## 问题根因

`ShareImagePreview` 虽然使用了 `fixed inset-0 z-[9999]`，但它被渲染在页面的 `h-screen overflow-y-auto` 滚动容器内部（`WealthBlockResult → ShareInfoCard → ShareImagePreview`）。

在微信等移动端浏览器中，当 `fixed` 元素位于 `overflow-y-auto` 滚动容器内时，不会真正脱离滚动容器的层叠上下文。结果就是页面的 `sticky top-0 z-50` 头部导航 和 `fixed bottom-0 z-50` 底部工具栏 显示在分享图片预览之上，图片被挡住。

## 修复方案

**文件: `src/components/ui/share-image-preview.tsx`**

使用 **React Portal** (`ReactDOM.createPortal`) 将整个预览组件渲染到 `document.body`，彻底脱离页面滚动容器的层叠上下文。

```tsx
import { createPortal } from 'react-dom';

// 在 return 中用 createPortal 包裹
return createPortal(
  <div className="fixed inset-0 z-[9999] ...">
    ...
  </div>,
  document.body
);
```

### 改动范围
- 仅修改 `src/components/ui/share-image-preview.tsx` 一个文件
- 添加 `createPortal` import，将返回的 JSX 用 `createPortal(jsx, document.body)` 包裹
- 全站所有使用 `ShareImagePreview` 的地方（XiaohongshuShareDialog、ShareInfoCard 等）自动生效

