

# 从源头到展示全链路优化排版

## 问题分析

当前排版问题不仅是展示层的问题，而是整个链路都缺少排版规范：

1. **AI 生成阶段**：`ai-generate-bundle` 的 prompt 只要求"80-150字"，没有格式要求，AI 返回大段密集文字
2. **润色阶段**：`polish_copy` 模式同样没有格式约束
3. **发布阶段**：`buildDescription` 直接拼接原文，无格式处理
4. **展示阶段**：`ProductDetailDialog` 的 `parseDescription` 按换行符拆分，但 AI 生成的文本通常没有合理换行

## 修改方案（3 个文件）

### 1. AI 生成 prompt 优化（`supabase/functions/ai-generate-bundle/index.ts`）

修改默认生成模式（约第 372 行）的 system prompt，要求 AI 输出结构化格式：

- 每个板块用 4-6 条要点表达，每条以 `✅` 开头
- 每条控制在 15-25 字
- 不要写成大段文字

同时修改 `polish_copy` 模式（约第 200-212 行）的 prompt：
- 要求润色后输出为 4-6 条 `✅` 开头的要点
- 保持每条 15-25 字

### 2. 发布时格式保障（`src/components/admin/industry-partners/BundlePublishPreview.tsx`）

修改 `buildDescription` 函数（约第 67-75 行），在拼接前对每段文案做格式规范化：
- 如果文本不包含换行或 `✅`，则按句号拆分并添加 `✅` 前缀
- 确保写入数据库的 description 始终是结构化格式

### 3. 展示层优化（`src/components/store/ProductDetailDialog.tsx`）

修改 `parseDescription` 函数和渲染逻辑（约第 42-126 行）：
- 长文本（超过 80 字且无换行）按句号智能拆分为多段
- 区块标题字号从 `text-sm` 改为 `text-base font-semibold`
- 区块内边距从 `px-3 py-2` 增加到 `px-4 py-3`
- 内容行距设为 `leading-relaxed`
- 有 `✅` 前缀的行保持原样，普通文本添加首行缩进（`text-indent: 2em`）
- 区块间距从 `space-y-2.5` 调整为 `space-y-3`
- 圆角从 `rounded-lg` 改为 `rounded-xl`

## 效果

- **新生成的组合产品**：AI 直接输出结构化要点，排版天然清晰
- **润色后的文案**：同样保持结构化格式
- **已有的长文本**：展示层自动按句号拆分，向下兼容
- **整个链路统一**：从生成到展示，排版标准一致

