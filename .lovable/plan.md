

## 财富卡点测评海报 - 完整流程修复

### 问题发现

通过代码审查，发现"财富卡点测评"模板虽然已添加到模板列表，但在以下关键位置缺少配置，会导致海报生成和展示出现问题：

### 需要修复的文件

**1. `src/components/poster/PosterGenerator.tsx`**
- `stylePrompts` 对象（第71-81行）缺少 `wealth_block` 的 AI 背景图提示词
- 当用户选择 AI 生成背景时，会回退到默认的 `emotion_button` 样式，不匹配财富测评主题

**2. `src/components/poster/PosterPreview.tsx`**
- `getProductSlogan()` 缺少 `wealth_block` 映射，会显示默认的"有劲生活"
- `getProductCategory()` 缺少 `wealth_block` 映射，会显示默认的"有劲生活"
- `gradientStyles` 缺少 `wealth_block` 的渐变色背景

### 具体改动

| 文件 | 位置 | 改动 |
|------|------|------|
| PosterGenerator.tsx | stylePrompts | 添加 `wealth_block` 的 AI 背景提示词（金色/琥珀色调，财富主题） |
| PosterPreview.tsx | getProductSlogan | 添加 `wealth_block: '3分钟发现财富盲点'` |
| PosterPreview.tsx | getProductCategory | 添加 `wealth_block: '心理测评'` |
| PosterPreview.tsx | gradientStyles | 添加 `wealth_block` 的琥珀-橙色渐变 |

### 改动量

共修改 2 个文件，每个文件添加 1-2 行配置，无逻辑变更。

