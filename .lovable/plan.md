

# AI 智能上架功能：图片/链接自动识别商品信息

## 目标

在合伙人"上架商品"流程中新增 **AI 智能上架** 入口。合伙人只需提供商品图片或商品链接，AI 自动提取商品名称、价格、描述、分类等信息，一键填充表单完成上架。

## 实现方案

### 1. 新建后端函数 `ai-extract-product`

**文件**: `supabase/functions/ai-extract-product/index.ts`

使用 Lovable AI（`google/gemini-3-flash-preview`，支持多模态识别图片）：

- **图片模式**: 前端将图片上传到 `partner-assets` 桶，把公开 URL 发给 AI，AI 通过视觉能力识别商品名、价格、描述、分类、标签等
- **链接模式**: 后端先通过 `fetch` 抓取网页 HTML（取前 5000 字符），再让 AI 从 HTML 中提取商品信息

使用 tool calling 输出结构化 JSON：

```text
{
  product_name, description, price, original_price,
  category, tags[], shipping_info
}
```

处理 429/402 错误并返回友好提示。

### 2. 改造 `PartnerStoreProducts.tsx`

在"上架商品"弹窗中新增 **AI 智能填充区域**（表单顶部）：

- 两种输入方式切换：
  - **上传图片**：选择商品截图/详情图，上传后调用 AI 识别
  - **粘贴链接**：输入商品页面 URL，调用 AI 抓取提取
- 点击"AI 识别"按钮后，loading 状态下调用 `ai-extract-product`
- 返回结果自动填充到下方表单（名称、价格、原价、描述、分类、标签、配送说明）
- 如果通过图片识别，同时将该图片设为商品头图
- 合伙人可手动修改 AI 填充的内容后再确认上架

### 3. UI 交互流程

```text
合伙人点击 "上架商品"
  ┌──────────────────────────────┐
  │  AI 智能上架（可选）          │
  │  [上传图片] 或 [粘贴链接]    │
  │  [ AI 识别 ]                 │
  └──────────────────────────────┘
  ↓ AI 返回后自动填充 ↓
  ┌──────────────────────────────┐
  │  商品名称: [已填充]          │
  │  价格: [已填充]              │
  │  描述: [已填充]              │
  │  ...其他字段...              │
  │  [ 确认上架 ]                │
  └──────────────────────────────┘
```

### 4. 配置更新

- `supabase/config.toml` 中新增 `ai-extract-product` 函数，`verify_jwt = false`

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/ai-extract-product/index.ts` | 新建 | AI 提取商品信息（图片视觉识别 + 链接抓取） |
| `supabase/config.toml` | 修改 | 注册新函数 |
| `src/components/partner/PartnerStoreProducts.tsx` | 改造 | 表单顶部新增 AI 智能填充区域 |

## 技术要点

- 使用 `google/gemini-3-flash-preview` 模型，支持图片内容识别（multimodal）
- 图片先上传到 `partner-assets` 桶获取公开 URL，再传给 AI（注意：桶目前为私有，需生成 signed URL 或改为 public）
- 链接抓取使用 `fetch` + HTML 截取，不依赖第三方爬虫服务
- 使用 tool calling 保证返回结构化数据，避免 JSON 解析失败

