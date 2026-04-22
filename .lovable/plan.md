

## 修复 "Powered by 有劲AI" 文案褪色问题

### 现状
截图显示底部 "Powered by 有劲AI" 字样几乎透明、淡到看不清，与浅米色背景融为一体，影响品牌呈现。

### 根因
`ShareCardBase` 或 `MiniAppEntry` 底部的品牌签名使用了过低的 opacity / 浅灰色（如 `text-gray-300` 或 `opacity-30`），在浅色背景上对比度严重不足。

### 修复方案

#### 一、定位文案位置
需先确认 "Powered by 有劲AI" 出现在：
- `MiniAppEntry.tsx` 页脚区，或
- `ShareCardBase.tsx` 底部品牌区，或
- 全局 Footer 组件

#### 二、视觉调整
- 移除淡出/低 opacity 样式
- "Powered by" 用中等灰（`text-muted-foreground`，约 60% 对比度），保持谦逊
- "有劲AI" 用品牌琥珀色（`text-amber-700` 或 `text-amber-600`）+ `font-semibold`，让品牌名清晰可读
- 整体保持小字号（`text-xs`），不喧宾夺主，但每个字符必须清晰

#### 三、参考标准
对齐 `BrandLogo` 组件中已建立的 `text-amber-700 font-medium` 品牌字色规范，保证全站品牌呈现一致。

### 涉及文件
- 定位后修改对应组件（预计为 `src/pages/MiniAppEntry.tsx` 或 `src/components/sharing/ShareCardBase.tsx`）

### 不动
- 字号、位置、布局
- 8 个场景卡、PTT 流程、计费、所有其他 UI

### 验证
- [ ] "Powered by 有劲AI" 在浅色背景下清晰可读
- [ ] "有劲AI" 四字呈品牌琥珀色，与 `BrandLogo` 一致
- [ ] 仍保持小字号、谦逊不抢戏

