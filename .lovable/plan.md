

## 在有劲生活馆新增「健康商城」分类

### 目标

在有劲生活馆（/energy-studio）新增第四个分类 Tab —— 「健康商城」，展示知乐荟商城的商品卡片，用户点击后直接跳转到对应小程序商品页购买。

### 方案概述

```text
有劲生活馆
├── 💜 情绪工具（已有）
├── 💚 自我探索（已有）
├── 🧡 生活管理（已有）
└── 🛒 健康商城（新增）
    ├── 商品卡片列表（图片 + 名称 + 价格 + 简介）
    └── 点击 → 跳转小程序商品页
```

### 技术方案

#### 1. 数据库：新建 `health_store_products` 表

存储商品展示信息和小程序跳转路径：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| product_name | text | 商品名称 |
| description | text | 简短描述 |
| price | numeric | 价格（元） |
| original_price | numeric | 原价（划线价，可选） |
| image_url | text | 商品图片 URL |
| mini_program_path | text | 小程序商品页路径，如 `/pages/goods/detail?id=xxx` |
| category | text | 商品分类（如"营养补充"、"健康食品"） |
| display_order | int | 排序 |
| is_available | boolean | 是否上架 |
| tags | text[] | 标签（如"热销"、"新品"） |
| created_at | timestamptz | 创建时间 |

RLS 策略：所有人可读（公开商品展示），仅管理员可写。

#### 2. 分类配置扩展

**文件：`src/config/energyStudioTools.ts`**

新增第四个分类：

```text
{
  id: "store",
  name: "健康商城",
  description: "精选健康好物，一键购买",
  emoji: "🛒",
  tabGradient: "from-rose-500 to-red-500"
}
```

`activeCategory` 类型扩展为 `"emotion" | "exploration" | "management" | "store"`。

#### 3. 商城展示组件

**文件：`src/components/store/HealthStoreGrid.tsx`（新建）**

- 从 `health_store_products` 表查询上架商品
- 按分类展示，2列网格布局
- 每个卡片包含：商品图片、名称、价格（含划线价）、标签徽章
- 点击跳转逻辑：
  - **小程序环境**：调用 `wx.miniProgram.navigateTo({ url: product.mini_program_path })`
  - **非小程序环境**：展示提示弹窗"请在微信中打开小程序购买"，或复制小程序链接 `#小程序://知乐荟商城/2yvmnaZMamGx1gf`

#### 4. 主页面集成

**文件：`src/pages/EnergyStudio.tsx`**

- 分类 Tab 新增"健康商城"
- 当 `activeCategory === "store"` 时，渲染 `<HealthStoreGrid />` 替代工具卡片列表
- 工具列表仍保持原逻辑不变

### 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新建 | 创建 `health_store_products` 表 + RLS |
| `src/config/energyStudioTools.ts` | 修改 | 新增 "store" 分类配置 |
| `src/pages/EnergyStudio.tsx` | 修改 | 集成商城分类和组件 |
| `src/components/store/HealthStoreGrid.tsx` | 新建 | 商品网格展示 + 小程序跳转 |

### 跳转逻辑细节

```text
用户点击商品卡片
  ├── 检测 isWeChatMiniProgram()
  │   ├── true → wx.miniProgram.navigateTo({ url: mini_program_path })
  │   └── false → 检测 isWeChatBrowser()
  │       ├── true → 尝试通过 wx-open-launch-weapp 标签打开小程序
  │       └── false → 显示 Dialog 提示"请在微信中扫码购买" + 二维码
```

### 管理后台

商品管理通过直接操作数据库表完成（后续可在 /admin 新增商品管理页面）。初期可通过 Cloud 后台直接添加商品数据。

