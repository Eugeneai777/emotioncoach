
## 问题全面诊断：分享卡片乱码（浏览器 + 微信均复现）

### 问题现象

从截图可以看到：
1. **标题「财富卡点测评」显示为方框/问号字符（乱码）**
2. 分享卡片其他元素（背景、布局）正常渲染
3. **问题在浏览器和微信中均复现**，说明不是环境特定问题

---

### 根因分析

经过代码审查，确认了**两个核心问题**都尚未被修复：

| 问题 | 位置 | 影响 |
|-----|-----|-----|
| **字体未就绪即渲染** | `shareCardConfig.ts:323-332` | `generateCanvas` 只等待图片加载，**不等待字体加载**。当系统字体未完全加载时，`html2canvas` 使用 fallback 字体导致乱码 |
| **对话框过早卸载** | `WealthInviteCardDialog.tsx:355` | `setOpen(false)` 同步执行，在图片预览组件完成渲染前就销毁源 DOM，打断 Canvas 数据传递 |

#### 为什么浏览器也出问题？

之前误以为只有微信有问题，但实际上：

```text
问题根源：html2canvas 内部流程
1. cloneNode(true) 克隆 DOM 元素
2. 遍历子元素，读取 computed styles（包括 font-family）
3. 如果此时浏览器尚未完成字体加载（或字体被缓存清理），会使用 fallback 字体
4. fallback 字体可能不包含中文字符 → 显示为方框
```

**关键洞察**：
- 现代浏览器的字体加载是异步的
- `document.fonts.ready` 是唯一可靠的字体就绪检测方式
- 当前代码**完全缺失**这一检测

---

### 修复方案

#### 修复 1：添加字体就绪检测

**文件**：`src/utils/shareCardConfig.ts`

**位置**：第 323 行之前（图片加载等待之前）

```typescript
// 🔧 新增：等待字体加载完成（解决中文乱码问题）
if (document.fonts && typeof document.fonts.ready !== 'undefined') {
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000)) // 3秒超时
    ]);
    debug && console.log('[shareCardConfig] Fonts ready');
  } catch (e) {
    debug && console.warn('[shareCardConfig] Fonts.ready failed:', e);
  }
}
```

**原理**：
- `document.fonts.ready` 返回一个 Promise，在所有字体加载完成后 resolve
- 添加 3 秒超时作为兜底，避免字体加载卡死
- 兼容所有现代浏览器（包括微信 WebView）

---

#### 修复 2：延迟关闭对话框

**文件**：`src/components/wealth-camp/WealthInviteCardDialog.tsx`

**位置**：第 351-355 行

```typescript
// 修改前
if (env.isWeChat || env.isIOS || env.isMiniProgram) {
  setPreviewImageUrl(blobUrl);
  setShowImagePreview(true);
  setOpen(false); // ❌ 同步关闭可能打断渲染
}

// 修改后
if (env.isWeChat || env.isIOS || env.isMiniProgram) {
  setPreviewImageUrl(blobUrl);
  setShowImagePreview(true);
  // ✅ 延迟关闭，确保图片预览组件完成初始化
  requestAnimationFrame(() => {
    setTimeout(() => setOpen(false), 50);
  });
}
```

**原理**：
- `requestAnimationFrame` 确保在下一个渲染帧执行
- 额外 50ms 延迟确保 React 完成 state 更新和组件挂载
- 图片预览组件在源对话框关闭前完全就绪

---

#### 修复 3：强制指定字体（兜底方案）

**文件**：`src/utils/shareCardConfig.ts`

**位置**：`onclone` 回调中（第 350-371 行）

```typescript
onclone: (_doc, element) => {
  // ... 现有代码 ...
  
  // 🔧 新增：强制设置中文 fallback 字体链
  const forceChineseFonts = (el: HTMLElement) => {
    const computedFont = getComputedStyle(el).fontFamily;
    if (!computedFont.includes('PingFang') && !computedFont.includes('Microsoft YaHei')) {
      el.style.fontFamily = `${computedFont}, "PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif`;
    }
  };
  
  forceChineseFonts(element);
  element.querySelectorAll('*').forEach((child: Element) => {
    if (child instanceof HTMLElement) {
      forceChineseFonts(child);
    }
  });
}
```

**原理**：
- 显式添加中文系统字体作为 fallback
- 确保即使 web font 加载失败，也能使用系统中文字体渲染

---

### 技术细节

#### 修改文件清单

| 文件 | 修改内容 | 影响范围 |
|-----|---------|---------|
| `src/utils/shareCardConfig.ts` | 添加 `document.fonts.ready` 等待 + 中文 fallback 字体 | 全站所有分享卡片 |
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 延迟 `setOpen(false)` | 财富测评/训练营分享对话框 |

#### 修复后的 generateCanvas 流程

```text
开始生成 Canvas
    ↓
1. ✅ await document.fonts.ready (新增)
    ↓
2. await waitForImages(clonedElement)
    ↓
3. await delay(renderDelay)
    ↓
4. html2canvas(clonedElement, { onclone: 强制中文字体 })
    ↓
5. 返回 canvas
```

#### 兼容性

| 环境 | `document.fonts.ready` 支持 |
|-----|---------------------------|
| Chrome/Edge | ✅ |
| Safari | ✅ |
| Firefox | ✅ |
| 微信 WebView | ✅ (基于 Chrome) |
| 微信小程序 WebView | ✅ |

---

### 为什么之前的修复没生效？

**答案：修复代码还没有被实际应用。**

之前的诊断和修复方案是作为"计划"提出的，但在后续对话中没有被实施（用户可能没有批准或切换了其他话题）。现在需要正式实施这些修复。
