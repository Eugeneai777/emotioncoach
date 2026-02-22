

## 优化权益对比页 - 分成产品内嵌到 matrix 表格

### 改动概要

将"分成产品"从简单的一行文字改为按分类逐行列出每个产品，直接嵌入权益对比 matrix 表格中，同时将升级按钮也作为 matrix 的最后一行，放在对应列下方。

### 唯一修改文件: `src/pages/PartnerBenefitsUnified.tsx`

#### 1. 替换"分成产品"和"适用产品"两行

删除第105-106行的两个简单文字行，替换为按分类展开的产品行：

```text
| 对比项                | 🦋绽放   | 💪有劲初级 | 🔥有劲高级 | 💎有劲钻石 |
|----------------------|---------|----------|----------|----------|
| ... 佣金等行 ...      |         |          |          |          |
| ── 分成产品 ──        |         |          |          |          |
| 365会员 ¥365         | ✓       | ✓        | ✓        | ✓        |
| 情绪日记训练营 ¥299    | ✓       | ✓        | ✓        | ✓        |
| 财富觉醒训练营 ¥299    | ✓       | ✓        | ✓        | ✓        |
| 青少年困境突破营 ¥299   | ✓       | ✓        | ✓        | ✓        |
| 初级合伙人 ¥792       | ✓       | ✓        | ✓        | ✓        |
| 高级合伙人 ¥3,217     | ✓       | ✓        | ✓        | ✓        |
| 钻石合伙人 ¥4,950     | ✓       | ✓        | ✓        | ✓        |
| 绽放系列产品          | ✓       | ✗        | ✗        | ✗        |
| ... 体验包/推广等行 ... |         |          |          |          |
| 升级                  | —       | —        | ¥3,217   | ¥4,950   |
|                      |         |          | [立即升级] | [立即升级] |
```

- 每个产品用 `commissionableProducts` 数据动态生成
- 绽放列全部打勾（bloom 可推广所有产品），有劲各级也全部打勾（有劲产品通用）
- 额外加一行"绽放系列产品"，仅绽放列打勾，有劲列打叉
- 产品名旁附带价格，便于一目了然

#### 2. 升级按钮从独立卡片移入 matrix 末尾行

- 删除第115-151行的独立升级卡片 grid
- 在 matrix rows 末尾追加一行 `{ label: "升级", values: [...] }`
- 绽放和当前等级列显示 "—"
- 可升级的列显示价格 + "立即升级"按钮（作为 ReactNode 嵌入）
- 按钮点击仍调用 `handleUpgrade('L2'/'L3')` 打开 `UnifiedPayDialog`

#### 3. 导入 `commissionableProducts`

在文件顶部将 `commissionableProducts` 加入已有的 import：

```typescript
import { totalCommissionableCount, commissionableProducts } from "@/config/youjinPartnerProducts";
```

### 最终 rows 结构

```typescript
rows={[
  // 佣金
  { label: "一级佣金", values: [...] },
  { label: "二级佣金", values: [...] },
  // 分成产品标题行
  { label: "── 分成产品 ──", values: ["", "", "", ""] },
  // 动态生成每个产品行
  ...commissionableProducts.map(p => ({
    label: `${p.name} ¥${p.price.toLocaleString()}`,
    values: [true, true, true, true]  // 所有等级都可分成
  })),
  // 绽放额外产品
  { label: "绽放系列产品", values: [true, false, false, false] },
  // 其他权益
  { label: "体验包", values: [...] },
  { label: "推广方式", values: [...] },
  { label: "专属服务", values: [...] },
  // 升级按钮行（仅当可升级时）
  ...(canUpgradeToL2 || canUpgradeToL3 ? [{
    label: "升级",
    values: [
      "—",
      "—",
      canUpgradeToL2 ? <升级按钮 L2> : "—",
      canUpgradeToL3 ? <升级按钮 L3> : "—",
    ]
  }] : []),
]}
```

### 技术细节

| 改动点 | 具体内容 |
|--------|----------|
| 导入 | `commissionableProducts` 加入 import |
| 删除行 | 第105-106行（分成产品/适用产品文字行） |
| 新增行 | 分成产品标题行 + 7个产品行 + 绽放额外行 + 升级按钮行 |
| 删除区域 | 第115-151行的独立升级卡片 grid |
| 升级按钮 | 作为 ReactNode 嵌入 matrix 值中，含价格文字和渐变按钮 |

共修改 1 个文件，无数据库改动。
