

# 修复 iPad/iPhone 生成分享卡片时屏幕卡顿问题

## 问题根因

`html2canvas` 是纯客户端渲染库，在主线程上执行以下操作，全部会阻塞 UI：

1. **DOM 克隆 + 样式计算**：`onclone` 回调中使用 `querySelectorAll('*')` 遍历所有子元素，逐个设置样式
2. **Canvas 像素渲染**：2x 缩放下生成大面积 Canvas（如 640x1600 像素），CPU 密集
3. **iOS 白边裁剪**：`trimBottomWhitespace` 逐行扫描像素数据，用 `getImageData` 频繁读取显存
4. **前置等待叠加**：字体加载（最多 3s）+ 图片加载 + 100ms 渲染延迟

在 iPad/iPhone 上，Safari 单线程模型让这些操作直接冻结页面交互。

## 修复方案

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/utils/shareCardConfig.ts` | 优化 onclone 性能、改进白边裁剪算法、添加 UI 让步机制 |
| `src/components/ui/share-dialog-base.tsx` | iOS 上先关闭 Dialog 再等一帧后开始生成 |

### 1. 优化 onclone 子元素遍历（shareCardConfig.ts）

当前：`querySelectorAll('*')` 遍历所有子元素并逐个设置样式和检查 `bg-clip-text`。对于复杂卡片可能有数百个元素。

优化：
- 仅对有 `background-clip: text` 的元素做修复（用更高效的 CSS 类选择器）
- 批量设置动画禁用：通过向克隆元素注入一个 `<style>` 标签替代逐元素设置
- 字体 fallback 仅设置根元素，CSS 继承自动传递给子元素

```text
优化前 (逐元素):
  element.querySelectorAll('*').forEach(child => {
    child.style.animation = 'none';
    child.style.transition = 'none';
    forceChineseFonts(child);      // 逐个设置字体
    // 检查 bgClip...
  });

优化后 (批量):
  // 注入全局样式，一次性禁用所有动画和设置字体
  const styleTag = doc.createElement('style');
  styleTag.textContent = '* { animation: none !important; transition: none !important; }';
  doc.head.appendChild(styleTag);
  
  // 字体只设根元素，子元素自动继承
  forceChineseFonts(element);
  
  // bg-clip-text 修复：仅处理使用了渐变文字的元素（通常很少）
  element.querySelectorAll('[class*="bg-clip"], [class*="text-transparent"]').forEach(...)
```

### 2. 优化白边裁剪算法（shareCardConfig.ts）

当前：逐行调用 `getImageData(x, y, 1, 1)` 采样，每行 20 次 GPU 读取，总计可能上千次。

优化：一次性读取底部 30% 区域的像素数据，在内存中遍历，减少 GPU 交互到 1 次。

```text
优化前:
  for y from bottom to top:
    for x in samples:
      ctx.getImageData(x, y, 1, 1)  // 每次都是 GPU 交互

优化后:
  const bottomRegion = ctx.getImageData(0, height * 0.7, width, height * 0.3);
  // 在内存中遍历 bottomRegion.data 数组
```

### 3. 添加 UI 让步机制（shareCardConfig.ts）

在 html2canvas 调用前后插入 `requestAnimationFrame` + 微任务让步，让浏览器有机会更新 UI：

```text
// 生成前让出一帧，确保 loading toast 显示出来
await new Promise(r => requestAnimationFrame(r));
await new Promise(r => setTimeout(r, 0));

// 调用 html2canvas
const canvas = await html2canvas(...);

// 裁剪前再让出一帧
await new Promise(r => requestAnimationFrame(r));
```

### 4. iOS Dialog 关闭时机优化（share-dialog-base.tsx）

当前已有 iOS 先关闭 Dialog 的逻辑，但 300ms 等待可能不够。优化为：
- 使用 `requestAnimationFrame` 等待实际帧渲染完成，而非固定延迟
- 确保 toast 提示已经渲染到屏幕上

```text
if (isiOS) {
  onOpenChange(false);
  loadingToastId = toast.loading('正在生成图片...');
  // 等待两帧确保 Dialog 关闭动画和 toast 都渲染完成
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}
```

### 预期效果

- onclone 优化：减少约 80% 的子元素遍历开销
- 白边裁剪优化：GPU 读取从上千次降到 1 次
- UI 让步：用户看到 loading 提示后才开始卡顿，感知卡顿时间缩短
- 总体：iOS 上的感知冻结时间应从 2-3 秒降至 1 秒左右

