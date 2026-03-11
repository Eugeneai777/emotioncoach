

# 安卓海报所有版本布局修复 + 容器增大 + 字体清晰度优化

## 问题分析

所有版本（默认、朋友圈、小红书、微信群）的海报都存在相同问题：
1. **容器高度 533px 太小**，安卓中文字体行高更大，内容溢出导致底部二维码和品牌 footer 被裁剪
2. **字体不够清晰**，`onclone` 中缺少 `-webkit-font-smoothing` 和 `text-rendering` 优化

## 修改方案

### 1. 增大标准容器尺寸

**`src/components/poster/PosterSizeSelector.tsx`**
- 标准：`300×533` → `300×560`
- 小红书：`360×480` → `360×510`

**`src/components/poster/PosterPreview.tsx`**（L750-751）
- 容器 `height: '533px'` → `'560px'`

**`src/components/poster/PosterWithCustomCopy.tsx`**（L60）
- 默认 `height = 533` → `height = 560`

**`src/components/poster/PosterGenerator.tsx`**（L170）
- `posterHeight = 533` → `posterHeight = 560`

**`src/components/poster/PosterWithCustomCopy.tsx`**（L85）
- scaleFactor 基准 `height / 533` → `height / 560`

### 2. 字体清晰度优化

**`src/utils/shareCardConfig.ts`**（onclone 中的 styleTag，约 L452）

在注入的全局样式中添加字体渲染优化：
```css
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

同时提升安卓 scale：`getOptimalScale` 中标准浏览器低端设备 `2.5` → `3`，非低端 `3` → `3.5`。

### 3. 各版本间距微调（PosterPreview.tsx）

由于容器增高 27px，各版本有更多空间，主要确保底部不截断：

- **朋友圈版**（renderMomentsLayout）：保持现有间距（有 flex:1 弹性空间，增高后自动适配）
- **小红书版**（renderXiaohongshuLayout）：数据卡片 padding `10px 8px` → `12px 10px`，数字 fontSize `20px` → `18px`，文字添加 `overflow: hidden` + `maxHeight`
- **微信群版**（renderWechatGroupLayout）：保持（有 flex:1 弹性，增高后自动适配）
- **默认版**（renderDefaultLayout）：保持（有 flex:1 弹性）

### 4. PosterWithCustomCopy 各版本同步

- **小红书版**数据卡片同样添加 `overflow: hidden` 防止文字溢出白框
- **朋友圈版** padding `28px 24px` → `24px 20px`（保持紧凑）

## 涉及文件

- `src/components/poster/PosterSizeSelector.tsx` — 尺寸常量
- `src/components/poster/PosterPreview.tsx` — 容器高度 + 小红书卡片修复
- `src/components/poster/PosterWithCustomCopy.tsx` — 默认高度 + 小红书卡片修复
- `src/components/poster/PosterGenerator.tsx` — 下载时的尺寸
- `src/utils/shareCardConfig.ts` — 字体渲染 + scale 优化

