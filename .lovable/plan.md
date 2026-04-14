
# 将 6 个套餐恢复为 ¥9.9，保留 3 个为 ¥0.01

## 当前状态

9 个套餐当前均为 **¥0.01**（之前已全部修改）。

## 恢复方案

| 套餐 | 当前价格 | 新价格 | 状态 |
|------|---------|--------|------|
| `alive_check`（活力自检） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `awakening_system`（觉醒系统） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `basic`（尝鲜会员） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `emotion_button`（情绪按钮） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `scl90_report`（SCL-90报告） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `wealth_block_assessment`（财富卡点测评） | ¥0.01 | **¥9.9** | ✅ 恢复 |
| `emotion_health_assessment`（情绪健康测评） | ¥0.01 | ¥0.01 | ⏸️ 保持 |
| `midlife_awakening_assessment`（中场觉醒力测评） | ¥0.01 | ¥0.01 | ⏸️ 保持 |
| `women_competitiveness_assessment`（35+女性竞争力测评） | ¥0.01 | ¥0.01 | ⏸️ 保持 |

## 数据库迁移

```sql
UPDATE packages 
SET price = 9.9 
WHERE package_key IN (
  'alive_check',
  'awakening_system',
  'basic',
  'emotion_button',
  'scl90_report',
  'wealth_block_assessment'
);
```

## 不影响的内容
- 前端代码无需修改（动态读取数据库价格）
- 支付流程不变
- 已购买记录和权限判断不受影响
- 唯一变化：新用户购买这 6 个套餐时显示 ¥9.9
