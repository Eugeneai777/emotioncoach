

## 在产品中心新增"9.9工具测评"分类

### 目标

在产品中心（`/packages`）的 Tab 栏中新增一个"9.9工具测评"类别，将目前散落在其他分类中的全部 ¥9.9 产品集中展示，方便用户快速浏览和购买。

### 涉及产品（共7款，均来自 `packages` 表）

| 产品名 | package_key | 说明 |
|--------|-------------|------|
| 尝鲜会员 | basic | 50点AI额度 |
| 情绪健康测评 | emotion_health_assessment | 56题情绪评估 |
| SCL-90心理测评 | scl90_report | 90题心理筛查 |
| 财富卡点测评 | wealth_block_assessment | 24题财富诊断 |
| 死了吗安全打卡 | alive_check | 生命觉察工具 |
| 觉察日记 | awakening_system | 日记式觉察 |
| 情绪SOS按钮 | emotion_button | 情绪急救工具 |

### 实现方案

#### 1. 扩展产品分类配置

在 `src/config/productCategories.ts` 中：
- 在 `ProductCategory` 的 `id` 联合类型中添加 `'tools-99'`
- 在 `productCategories` 数组中新增一项，放在"有劲会员"之后（第二个位置）：
  - id: `'tools-99'`
  - name: `'9.9工具'`
  - emoji: `'🧰'`
  - gradient: `'from-cyan-500 to-blue-500'`
  - tagline: `'先体验后付费 · 每项仅¥9.9'`

#### 2. 更新 Packages 页面的 Tab 类型

在 `src/pages/Packages.tsx` 中：
- 将 `activeTab` 的类型联合中添加 `'tools-99'`

#### 3. 在 ProductComparisonTable 中新增渲染分支

在 `src/components/ProductComparisonTable.tsx` 中添加 `category === 'tools-99'` 的渲染逻辑：

- 从 `packages` 表动态获取全部 ¥9.9 产品（已有 `usePackages` hook）
- 每个产品用一张卡片展示（复用现有的 `PackageCard` 组件样式）：
  - 产品图标 + 名称 + ¥9.9 价格
  - 3-4 条功能亮点
  - "立即购买"按钮（已购买的显示"已购买"并置灰）
- 需要对每个产品做已购买状态检查（查询 `orders` 或 `subscriptions` 表）
- 点击购买后调用现有的 `onPurchase` 回调，走统一支付流程

卡片布局示意（移动端）：
```text
+---------------------------+
| 🧰  9.9工具测评           |
| 先体验后付费 · 每项仅¥9.9  |
+---------------------------+
| 🎫 尝鲜会员    ¥9.9       |
| [50点] [5位教练] [7天有效] |
|        [立即购买]          |
+---------------------------+
| 💚 情绪健康测评  ¥9.9     |
| [56题] [5维度] [个性化报告]|
|        [立即购买]          |
+---------------------------+
| 📋 SCL-90测评   ¥9.9     |
| [90题] [10因子] [雷达图]  |
|        [立即购买]          |
+---------------------------+
|  ... 更多产品卡片 ...      |
+---------------------------+
```

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/productCategories.ts` | 修改 | 添加 `'tools-99'` 分类定义和类型 |
| `src/pages/Packages.tsx` | 修改 | Tab 状态类型扩展 |
| `src/components/ProductComparisonTable.tsx` | 修改 | 新增 `tools-99` 分类的渲染逻辑 |

### 技术细节

**产品数据来源**：直接从已有的 `usePackages` hook 获取，筛选 `price <= 10` 的产品即可，无需额外数据库查询。

**已购买检测**：
- 尝鲜会员（basic）：复用现有的 `usePackagePurchased('basic')` 逻辑
- 测评类产品：查询 `orders` 表中 `package_key` 匹配且 `status = 'paid'` 的记录
- 工具类产品（alive_check, awakening_system, emotion_button）：同样查询 `orders` 表

**购买流程**：点击"立即购买"后调用 `onPurchase({ key, name, price })`，复用现有的微信支付/支付宝支付弹窗，无需任何支付逻辑变更。

**产品展示信息配置**：在 `ProductComparisonTable` 中定义一个本地的产品信息映射（名称、图标、功能亮点列表），与 `packages` 表的 `package_key` 对应，确保卡片展示内容丰富。

