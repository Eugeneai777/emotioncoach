

# 在组合包编辑中添加 AI 主图生成功能

## 功能概述

在组合包创建/编辑对话框中，新增"AI 生成主图"按钮，使用 Nano banana 模型（`google/gemini-2.5-flash-image`）根据产品名称和文案内容自动生成电商风格的产品主图。生成后的图片上传至 `partner-assets` 存储桶，URL 保存到组合包的 `cover_image_url` 字段。

## 改动方案

### 1. Edge Function: `supabase/functions/ai-generate-bundle/index.ts`

新增 `type: "generate_cover_image"` 处理分支：

- 接收 `bundleName`、`products`、`aiContent` 参数
- 调用 `google/gemini-2.5-flash-image` 模型，带 `modalities: ["image", "text"]`
- Prompt 指示生成：简洁的中文电商主图，健康/养生风格，品牌绿色调
- 从返回的 `images[0].image_url.url` 取 base64 数据
- 解码 base64 后上传到 `partner-assets` 存储桶（文件名用 UUID 避免中文问题）
- 返回公开 URL

### 2. 前端: `src/components/admin/industry-partners/PartnerProductBundles.tsx`

在文案区域下方、保存按钮上方，添加主图区域：

- 新增状态：`generatingImage`（加载中标志）
- 展示区域：
  - 如果已有 `cover_image_url`，显示图片预览
  - 显示"AI 生成主图"按钮，点击调用 edge function
- 生成后自动更新 `coverImageUrl` 状态
- 保存组合包时将 `cover_image_url` 一并写入

### 3. 上架时使用主图

`BundlePublishPreview.tsx` 中，如果 `bundle.cover_image_url` 存在，商城卡片预览和实际上架都使用该图片替代默认渐变背景。

## 技术细节

| 文件 | 改动 |
|------|------|
| `supabase/functions/ai-generate-bundle/index.ts` | 新增 `generate_cover_image` 分支，调用 Nano banana 生成图片并上传存储桶 |
| `src/components/admin/industry-partners/PartnerProductBundles.tsx` | 新增主图预览区 + AI 生成按钮 + `generatingImage` 状态 |
| `src/components/admin/industry-partners/BundlePublishPreview.tsx` | 卡片预览区优先使用 `cover_image_url` 展示真实主图 |

## 数据流

1. 用户点击"AI 生成主图"
2. 前端调用 `ai-generate-bundle`，`type: "generate_cover_image"`
3. Edge Function 调用 Gemini 图片模型生成 base64 图片
4. Edge Function 将图片上传到 `partner-assets` 存储桶
5. 返回公开 URL，前端展示预览
6. 保存时写入组合包的 `cover_image_url`
7. 上架时自动使用该图片作为商城商品主图

