

# 去除 AI 主图生成，仅保留文案生成

## 问题

AI 主图生成（调用 `google/gemini-3-pro-image-preview`）不稳定，经常失败导致整个 AI 生成流程报错。主图生成不是核心需求，文案才是关键。

## 改动方案

### 1. 边缘函数：移除图片生成逻辑

**文件：** `supabase/functions/ai-generate-bundle/index.ts`

- 删除第 254-325 行的整段图片生成代码（imagePrompt 构建、调用 gemini image API、上传 storage）
- 返回值中 `cover_image_url` 固定为 `null`
- 保留文案生成和其他模式（optimize_name、suggest_bundle）不变

### 2. 前端：移除主图相关状态和展示

**文件：** `src/components/admin/industry-partners/PartnerProductBundles.tsx`

- 移除 `coverImageUrl` / `setCoverImageUrl` 状态
- `handleAIGenerate` 回调中删除 `cover_image_url` 的处理和 toast
- `handleSave` 中 `cover_image_url` 固定为 `null`
- 编辑恢复（`handleEdit`）中移除 `setCoverImageUrl`
- 卡片列表中移除 `bundle.cover_image_url` 的图片展示

**文件：** `src/components/admin/industry-partners/BundlePublishPreview.tsx`

- 卡片预览中移除主图展示，使用纯色渐变背景替代（与品牌色一致）
- 上架写入数据库时 `image_url` 和 `detail_images` 设为空或使用默认占位图

### 3. Bundle 类型定义

两个文件中的 `ProductBundle` 接口保留 `cover_image_url` 字段（设为可选 `string | null`），避免破坏已保存数据的兼容性。

