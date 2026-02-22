

## 合伙人中心页面优化 - 海报独立卡片 + 双权益展示

### 改动概要

#### 1. 海报按钮独立为卡片
**文件**: `src/components/partner/PromotionHub.tsx`
- 从底部 3 列按钮组（复制/二维码/海报）中移除"海报"按钮
- 按钮组改为 2 列（复制/二维码）

**文件**: `src/pages/Partner.tsx`
- 在推广 Tab 内，PromotionHub 下方新增一个独立的"AI 海报中心"卡片
- 卡片采用橙色渐变风格，包含简要说明和"生成海报"按钮，点击跳转 `/poster-center`

#### 2. 权益按钮展示双权益（matrix 对比排版）
**文件**: `src/pages/Partner.tsx`
- 页面右上角"我的权益"按钮点击后，不再跳转单一页面
- 改为在页面内展示一个双权益对比卡片区域（或改为跳转到一个同时展示两种权益的页面）

具体方案：将右上角按钮的跳转逻辑改为跳转到新的统一权益页面，在该页面用 matrix 对比排版同时展示绽放权益和有劲权益。

**新文件**: `src/pages/PartnerBenefitsUnified.tsx`
- 顶部标题："我的合伙人权益"
- 采用两列对比卡片布局（移动端堆叠）：
  - 左列：🦋 绽放合伙人权益（紫色调）- 从 `partner_benefits` 表读取
  - 右列：💪 有劲初级合伙人权益（橙色调）- 从 `partnerLevels` 配置读取 L1 权益
- 底部用 `ResponsiveComparison` 组件展示佣金对比 matrix 表格：

```text
| 对比项     | 🦋 绽放合伙人    | 💪 有劲初级合伙人 |
|-----------|-----------------|------------------|
| 佣金比例   | 30% + 10%       | 18%              |
| 适用产品   | 绽放+有劲产品    | 有劲产品          |
| 体验包     | 含有劲体验包     | 100份体验包       |
| 推广方式   | 推广码/链接      | 兑换码/二维码     |
```

**文件**: `src/App.tsx`
- 注册新路由 `/partner/benefits-all`

**文件**: `src/pages/Partner.tsx`
- 右上角"我的权益"按钮跳转改为 `/partner/benefits-all`（bloom 合伙人时）

### 技术细节

| 文件 | 改动 |
|------|------|
| `src/components/partner/PromotionHub.tsx` | 移除海报按钮，按钮组从 3 列改 2 列 |
| `src/pages/Partner.tsx` | 推广 Tab 新增海报卡片；权益按钮跳转改为统一权益页 |
| `src/pages/PartnerBenefitsUnified.tsx` | 新建统一权益页，双列对比 + matrix 表格 |
| `src/App.tsx` | 新增路由 `/partner/benefits-all` |

共 4 个文件修改/新建，无数据库改动。

