

# 产品组合包上架为商城商品卡片

## 方案概述

组合包创建完成后，在管理界面增加"上架到商城"功能，将组合包作为一个新商品写入 `health_store_products` 表。上架前可预览最终商品卡片效果，产品名称也支持 AI 优化。

**上架位置：健康商城（有劲生活馆）**

理由：
- 商城已有完整的商品卡片、详情页、结算、支付、订单、佣金分成流程
- 组合包上架后自动继承所有现有能力（分类、标签、库存、分成等）
- 用户端无需任何改动即可看到新商品

## 用户操作流程

```text
创建/编辑组合包 -> AI 生成文案和主图
  -> 点击"上架到商城"
  -> 弹出预览卡片（模拟真实商城卡片样式）
  -> 可点"AI 优化名称"精炼产品名
  -> 可微调价格、分类、标签
  -> 确认上架 -> 写入 health_store_products
  -> 商城立即可见
```

## 技术改动

### 1. 前端：PartnerProductBundles.tsx

在每个组合包卡片上新增"上架到商城"按钮，以及新增两个 Dialog：

**a) 预览 + 上架 Dialog**
- 左侧：模拟商城卡片样式预览（主图 + 名称 + 价格 + 标签）
- 右侧/下方：可编辑字段
  - 产品名称（带"AI 优化"按钮，调用边缘函数生成更具吸引力的名称）
  - 价格（默认为组合包 total_price）
  - 原价（可选，用于显示划线价）
  - 分类（下拉选择）
  - 标签（输入）
  - 库存（默认 -1 = 无限）
- 描述：自动拼接 AI 四板块内容
- 详情图：主图 + 组合包内各产品图
- 确认后 INSERT 到 `health_store_products`，关联 `partner_id`

**b) AI 名称优化**
- 复用现有 `ai-generate-bundle` 边缘函数，新增一个 `optimize_name` 模式
- 传入当前名称和产品列表，返回 3 个优化建议供选择

### 2. 边缘函数：ai-generate-bundle/index.ts

新增 `type: "optimize_name"` 分支：
- 接收：当前名称 + 产品列表
- 返回：3 个优化后的名称建议
- 使用 tool calling 结构化输出

### 3. 已上架状态追踪

在组合包 JSON 结构中新增 `published_product_id` 字段：
- 上架成功后记录 `health_store_products` 表中的商品 ID
- 卡片上显示"已上架"状态标识
- 支持"下架"操作（将商品 `is_available` 设为 false）

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/admin/industry-partners/PartnerProductBundles.tsx` | 修改 | 增加上架按钮、预览 Dialog、AI 名称优化 |
| `src/components/admin/industry-partners/BundlePublishPreview.tsx` | 新建 | 上架预览组件（模拟商城卡片 + 编辑表单） |
| `supabase/functions/ai-generate-bundle/index.ts` | 修改 | 新增 optimize_name 分支 |

## 预览卡片设计

预览区域模拟真实商城卡片样式：
- 圆角卡片，主图占上半部分（1:1 比例）
- 下方显示名称（2 行截断）、描述（1 行截断）、价格（红色粗体）+ 原价划线
- 标签 Badge 行
- 底部模拟"立即购买"按钮

这样管理员上架前就能看到用户端的真实效果。

## 组合包 JSON 结构更新

```text
{
  id: "uuid",
  name: "知乐身心健康套餐",
  products: [...],
  ai_content: {...},
  cover_image_url: "...",
  published_product_id: "uuid" | null,  // 新增：关联商城商品 ID
  created_at: "..."
}
```
