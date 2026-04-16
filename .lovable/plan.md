

# 套餐体系统一 — 数据库驱动 + 全站对齐

## 现状问题

1. **数据库缺 2 档套餐**：`packages` 表只有 `basic`(¥9.9/50点) 和 `member365`(¥365/1000点)，没有 ¥49.9 和 ¥99
2. **QuotaRechargeDialog 硬编码错误 key**：`quota_9_9`、`quota_49_9`、`quota_99` 在数据库中不存在，支付后 self-healing 无法匹配，**会导致支付成功但点数不到账**
3. **PackageSelectionStep（语音余额不足弹窗）** 只展示 basic 和 member365 两档
4. **充值弹窗不显示会员名称和说明**

## 改动范围与影响评估

### 不影响现有业务逻辑的改动

| 改动 | 影响范围 | 说明 |
|------|----------|------|
| 数据库插入 2 条新套餐 | 无副作用 | 新增行，不修改现有数据 |
| QuotaRechargeDialog 改为数据库驱动 | 仅充值弹窗 | 修复当前硬编码 key 不匹配的 bug |
| PackageSelectionStep 从 2 档改 4 档 | 语音余额不足弹窗 | 扩展展示，原有 basic/member365 逻辑不变 |

### 不涉及的部分（保持原样）

- `UnifiedPayDialog` / `WechatPayDialog` / `AlipayPayDialog` — 不改动
- `PurchaseOnboardingDialog` 流程（package → payment → register → follow）— 不改动
- 订单创建、self-healing、callback — 不改动
- 其他页面的套餐引用（训练营、测评、合伙人）— 不受影响

## 实现方案

### 1. 数据库：插入 2 个新套餐 + 调整排序

```sql
INSERT INTO packages (package_key, package_name, price, ai_quota, duration_days, description, is_active, display_order)
VALUES 
  ('standard_49', '标准会员', 49.9, 300, 365, '日常情绪管理，满足普通用户需求', true, 1),
  ('premium_99', '畅享会员', 99, 800, 365, '高频用户性价比之选，深度情绪成长', true, 1);

-- 调整 display_order 确保排序：basic(1) < standard_49(2) < premium_99(3) < member365(4)
UPDATE packages SET display_order = 1 WHERE package_key = 'basic';
UPDATE packages SET display_order = 2 WHERE package_key = 'standard_49';
UPDATE packages SET display_order = 3 WHERE package_key = 'premium_99';
UPDATE packages SET display_order = 4 WHERE package_key = 'member365';
```

### 2. `QuotaRechargeDialog.tsx` — 改为数据库驱动

- 用 `usePackages` hook 读取数据库，按 `['basic','standard_49','premium_99','member365']` 筛选
- 卡片显示：会员名称 + description + 价格 + 点数 + 单价
- `premium_99` 标注"最超值"
- 传给 `UnifiedPayDialog` 的 key 与数据库 `package_key` 一致（修复当前 bug）
- 加载中显示骨架屏

### 3. `PackageSelectionStep.tsx` — 从 2 档改为 4 档

- 展示全部 4 档会员，2×2 网格布局（手机端友好）
- 每张卡片：会员名称、description、点数、有效期、价格
- `premium_99` 标注"最超值"，`basic` 保留"新用户推荐"
- `PurchaseOnboardingDialog` 的 `defaultPackage` 类型从 `'basic' | 'member365'` 扩展为包含新 key

## 修改文件清单

| 文件 | 改动类型 | 改动量 |
|------|----------|--------|
| 数据库 | INSERT + UPDATE display_order | 2 条插入 + 4 条更新 |
| `src/components/QuotaRechargeDialog.tsx` | 重写 | ~100 行 |
| `src/components/onboarding/PackageSelectionStep.tsx` | 重写 | ~100 行 |
| `src/components/onboarding/PurchaseOnboardingDialog.tsx` | 微调 defaultPackage 类型 | ~2 行 |

## 兼容性

- **手机端**：2×2 网格在 375px 宽度下每卡约 165px，足够展示内容
- **电脑端**：sm:max-w-md 的弹窗内 2×2 网格排版整齐
- **跳转流畅**：不改动支付流程和导航逻辑，复用现有 `UnifiedPayDialog`
- **数据一致**：充值弹窗和余额不足弹窗使用同一份数据库数据，展示完全一致

