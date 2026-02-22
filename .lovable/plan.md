

## 统一卡片生成与分享系统 - 全面整合方案

### 当前问题总结

系统中存在 **3 种并行的分享实现路径**，导致不同卡片在微信/iOS 上表现不一致：

| 路径 | 使用方式 | 问题 |
|------|----------|------|
| A. `ShareDialogBase` | 统一弹窗组件，内置 `generateCardBlob` | 最完整，含 iOS scroll-lock 修复 |
| B. 直接 `import html2canvas` | 5 个文件自行调用 html2canvas | 缺少 iOS 白边裁剪、空白检测、scroll-lock 清理 |
| C. `useOneClickShare` hook | 训练营邀请卡等 | 依赖隐藏 DOM 元素，微信中不稳定 |

### 需要修复的 5 个直接 html2canvas 调用

| 文件 | 当前问题 | 修复方案 |
|------|----------|----------|
| `SCL90ShareDialog.tsx` | 手写整套 Dialog + html2canvas 逻辑（~240 行） | 改用 `ShareDialogBase`，删除 ~150 行重复代码 |
| `PosterCenter.tsx` | 直接 html2canvas + 手动样式操作 | 改用 `generateCardBlob` |
| `PosterGenerator.tsx` | 直接 html2canvas + 手动分享逻辑 | 改用 `generateCardBlob` + `handleShareWithFallback` |
| `EnergyDeclaration.tsx` | 直接 html2canvas + 手动 navigator.share | 改用 `generateCardBlob` + `handleShareWithFallback` |
| `WeeklyTagReport.tsx` | 直接 html2canvas 用于 PDF 导出 | 保留（PDF 用途不同于分享，不需要统一） |

### 修复方案详情

#### 1. SCL90ShareDialog.tsx - 重构为 ShareDialogBase

当前是完全手写的 Dialog（含 html2canvas 调用、scroll-lock 清理、预览管理），但 `ShareDialogBase` 已经封装了所有这些逻辑。

**改动**：
- 移除直接 `import html2canvas`
- 移除手写的 `handleGenerate`（含 html2canvas 调用、blob 转换）
- 移除手写的 Dialog 布局、预览管理、scroll-lock 清理
- 改用 `ShareDialogBase`，传入 `previewCard` 和 `exportCard`
- 从 ~240 行减少到 ~80 行

#### 2. PosterCenter.tsx - 替换 html2canvas 为 generateCardBlob

**改动**：
- 移除 `import html2canvas`
- `handleDownload` 中的直接 html2canvas 调用改为 `generateCardBlob`
- 移除手动样式操作（fixed 定位、z-index 等），改用 `generateCanvas` 的 `onclone` 处理

#### 3. PosterGenerator.tsx - 替换 html2canvas 为 generateCardBlob

**改动**：
- 移除 `import html2canvas`
- 生成逻辑改用 `generateCardBlob`，获得统一的 iOS 白边裁剪和空白检测

#### 4. EnergyDeclaration.tsx - 替换 html2canvas 为统一分享流程

**改动**：
- 移除 `import html2canvas`
- `generatePosterBlob` 改用 `generateCardBlob`
- `handleDownload` 中的手动 `navigator.share` 改用 `handleShareWithFallback`
- 获得统一的微信/iOS 兼容处理

#### 5. WeeklyTagReport.tsx - 保留不动

PDF 导出场景与卡片分享不同，html2canvas + jsPDF 的组合是合理的，不需要统一。

### 改动文件清单

| 文件 | 改动量 | 说明 |
|------|--------|------|
| `src/components/scl90/SCL90ShareDialog.tsx` | 大 | 重写为 ShareDialogBase，删除 ~150 行 |
| `src/pages/PosterCenter.tsx` | 中 | html2canvas 改 generateCardBlob |
| `src/components/poster/PosterGenerator.tsx` | 中 | html2canvas 改 generateCardBlob |
| `src/components/tools/EnergyDeclaration.tsx` | 中 | html2canvas 改统一分享流程 |

### 不改的部分

- `WeeklyTagReport.tsx`：PDF 导出，非分享场景
- `WealthCampShareCard.tsx` / `AIAnalysisShareCard.tsx` / `XiaohongshuShareCard.tsx`：这些独立卡片虽未用 ShareCardBase，但它们的分享 Dialog 已使用 `ShareDialogBase`，分享流程是统一的。视觉迁移到 ShareCardBase 有回归风险，建议后续单独处理
- `useOneClickShare` hook：训练营邀请卡专用，改动影响面大，建议后续单独优化

### 风险评估

| 风险 | 等级 | 应对 |
|------|------|------|
| SCL90 分享卡片视觉变化 | 低 | ShareDialogBase 的预览/导出分离机制与原实现一致 |
| PosterCenter 海报尺寸变化 | 中 | generateCardBlob 的 explicitWidth/Height 参数可精确控制 |
| EnergyDeclaration 1080x1920 特殊尺寸 | 中 | 保留 canvas 后处理逻辑（缩放到目标尺寸） |

### 无数据库改动

纯前端重构，改 4 个文件。

