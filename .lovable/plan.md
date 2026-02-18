
# 行业合伙人产品组合包 + AI 智能生成

## 概要

在行业合伙人管理页面新增"产品组合包"功能，让管理员可以从三个来源选取产品进行组合：
1. **有劲系列产品**（packages 表中的 9.9 元工具、训练营、会员等）
2. **绽放系列产品**（绽放训练营、教练认证、绽放合伙人等）
3. **健康商城商品**（health_store_products 表中该合伙人的自有商品）

选好产品后，点击"AI 智能生成"，自动产出四大板块描述 + 商品主图：
1. 目标人群
2. 解决痛点
3. 如何解决和提供价值
4. 可以看到什么结果和收获

同时调用 AI 图片生成接口制作产品包主图。

---

## 用户操作流程

```text
进入行业合伙人详情 -> 新增 Tab "产品组合包"
  -> 点击"创建组合包"
  -> 填写组合包名称
  -> 下拉多选：有劲产品 / 绽放产品 / 商城商品
  -> 点击"AI 智能生成"
  -> AI 自动填充：目标人群、痛点、价值、收获
  -> AI 自动生成主图
  -> 管理员可手动微调
  -> 保存到 custom_product_packages
```

---

## 技术方案

### 1. 数据存储

使用 partners 表已有的 `custom_product_packages` (JSON) 字段存储，结构如下：

```text
custom_product_packages: [
  {
    id: "uuid",
    name: "知乐身心健康套餐",
    products: [
      { source: "package", key: "emotion_health_assessment", name: "情绪健康测评", price: 9.9 },
      { source: "package", key: "member365", name: "365会员", price: 365 },
      { source: "store", id: "xxx", name: "知乐胶囊", price: 389 }
    ],
    total_price: 763.9,
    ai_content: {
      target_audience: "...",
      pain_points: "...",
      solution: "...",
      expected_results: "..."
    },
    cover_image_url: "https://...",
    created_at: "2026-02-18T..."
  }
]
```

不需要新建数据库表，复用现有 JSON 字段即可。

### 2. 新增前端组件

**`src/components/admin/industry-partners/PartnerProductBundles.tsx`**

核心功能：
- 显示已创建的组合包列表（卡片形式，含主图、名称、产品数、总价）
- "创建组合包"按钮打开 Dialog
- Dialog 内容：
  - 组合包名称输入框
  - **多选下拉**：分组展示所有可选产品
    - 有劲系列：尝鲜会员、情绪健康测评、SCL-90、财富卡点、训练营、365会员等
    - 绽放系列：身份/情感/生命绽放营、教练认证、绽放合伙人
    - 商城商品：该合伙人在 health_store_products 中的商品
  - "AI 智能生成"按钮
  - 四个文本区域（目标人群 / 痛点 / 价值 / 收获）
  - 主图预览区
  - 保存 / 取消按钮

### 3. 新增边缘函数

**`supabase/functions/ai-generate-bundle/index.ts`**

接收：
- 组合包名称
- 已选产品列表（名称 + 价格 + 描述）

返回（通过 tool calling 结构化输出）：
- target_audience: 目标人群描述
- pain_points: 解决痛点
- solution: 如何解决和提供价值
- expected_results: 可以看到什么结果和收获

同时调用 `google/gemini-2.5-flash-image` 生成产品包主图，上传到 partner-assets 存储桶，返回 URL。

### 4. 集成到行业合伙人详情页

在 `IndustryPartnerManagement.tsx` 的 Tabs 中新增一个 "产品组合包" Tab：

```text
飞轮分析 | 商城商品 | 商城订单 | 产品组合包（新增）
```

### 5. 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/admin/industry-partners/PartnerProductBundles.tsx` | 新建 | 组合包管理主组件 |
| `supabase/functions/ai-generate-bundle/index.ts` | 新建 | AI 生成四板块内容 + 主图 |
| `src/components/admin/IndustryPartnerManagement.tsx` | 修改 | 添加"产品组合包" Tab |
| `supabase/config.toml` | 修改 | 注册新边缘函数（自动处理） |

### 6. AI 主图生成流程

1. 边缘函数收到产品列表后，先用 `google/gemini-3-flash-preview` 生成文案
2. 然后用 `google/gemini-2.5-flash-image` 生成主图，Prompt 包含组合包名称和产品关键词
3. 从返回的 base64 数据解码并上传到 `partner-assets` 存储桶
4. 返回公开 URL 给前端

### 7. 产品数据加载

前端组件启动时并行加载：
- `packages` 表（is_active = true）获取所有有劲/绽放产品
- `health_store_products` 表（partner_id = 当前合伙人，is_available = true）获取商城商品
- 合并为分组下拉选项
