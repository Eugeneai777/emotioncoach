

## 将 mini-app 中「中场觉醒力测评」改为 0.01 元（测试价）

### 定位
"中场觉醒力测评"对应 package_key 应为 `awakening_system`（中场觉醒系统测评），属于 9 个核心测评之一，标准定价 ¥9.9（见 mem://product/pricing/assessment-standard-pricing-zh）。

### 排查步骤
1. 在 `/mini-app` 页面定位"中场觉醒力测评"卡片，确认 package_key
2. 检查 `packages` 表中该 key 当前价格
3. 通过 SQL 把 `packages.price` 改为 0.01

### 修改清单

| 项 | 内容 |
|------|------|
| SQL Update | `UPDATE packages SET price = 0.01 WHERE package_key = 'awakening_system'` |
| 前端 | 无需改动（价格走 `usePackages` 动态读取） |

### 注意事项
- 这是测试价，与之前 standard_49 / premium_99 / member365 / basic 改 0.01 同批
- 履约逻辑已在上一轮幂等化修复，0.01 支付成功后会正常发放该测评权益
- 建议确认 mini-app 上的卡片显示是否硬编码 ¥9.9，如硬编码需要同步调整 UI

### 待确认
我需要先 read 一下 `/mini-app` 入口和 `packages` 表，确认 package_key 是否真为 `awakening_system`，以及前端是否动态读价。批准后开始执行。

