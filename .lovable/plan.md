

# 将 9 个 ¥9.9 套餐价格改为 ¥0.01

## 当前 ¥9.9 的套餐（共 9 个）

| # | package_key | 说明 |
|---|------------|------|
| 1 | `alive_check` | 活力自检 |
| 2 | `awakening_system` | 觉醒系统 |
| 3 | `basic` | 尝鲜会员 |
| 4 | `emotion_button` | 情绪按钮 |
| 5 | `emotion_health_assessment` | 情绪健康测评 |
| 6 | `midlife_awakening_assessment` | 中场觉醒力测评 |
| 7 | `scl90_report` | SCL-90 报告 |
| 8 | `wealth_block_assessment` | 财富卡点测评 |
| 9 | `women_competitiveness_assessment` | 35+女性竞争力测评 |

## 修改方案

### 数据库迁移（唯一改动）
```sql
UPDATE packages SET price = 0.01 WHERE price = 9.9;
```

一条 SQL 即可完成。**无需修改任何前端代码**——所有页面都通过 `usePackages` / `usePackageByKey` 从数据库读取价格并动态渲染，代码中的 `9.9` 仅作为 fallback 默认值，数据库有值时不会生效。

### 不受影响的内容
- 支付流程（UnifiedPayDialog 读取数据库价格）
- 已购买记录和权限判断
- 页面展示文案中硬编码的 `¥9.9`（如介绍页的营销文案）仅为视觉参考，实际支付金额由数据库决定

### 风险提示
- 少数页面（如 MamaAssistant、AwakeningIntro）有硬编码的 `¥9.9` 文案，这些文案不会自动更新为 `¥0.01`，但**不影响实际支付金额**。如需同步更新文案，需额外修改约 5 个文件。

