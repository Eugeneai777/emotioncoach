

## CTA 按钮跳转逻辑优化

### 目标
根据落地页的 `matched_product` 字段，将 CTA 按钮跳转到对应的 Lite 产品页面，并携带合伙人推荐参数。

### 产品路由映射表

| 产品关键词 | 跳转路径 |
|-----------|---------|
| 财富 | `/wealth-assessment-lite` |
| 情绪健康 | `/emotion-health-lite` |
| SCL-90 / 心理 | `/scl90-lite` |
| 死了吗 | `/alive-check-lite` |
| 觉察日记 / 觉察 | `/awakening-lite` |
| 情绪按钮 / 情绪SOS | `/emotion-button-lite` |
| 默认（无匹配） | `/introduction` |

### 实现方式

修改 `src/pages/LandingPage.tsx` 中的 CTA `onClick` 逻辑：

1. 创建一个关键词到路径的映射数组（按优先级排列）
2. 遍历映射表，用 `matched_product` 字段进行关键词匹配
3. 匹配成功则跳转对应 Lite 页面，未匹配则跳转 `/introduction`
4. 所有链接附加 `?ref=partnerId` 参数以保留合伙人归因

### 技术细节

当前数据库中 `matched_product` 的值示例为 `"情绪健康测评 / 职场压力卡点测评"`（可能包含多个产品名称），因此使用 `includes()` 关键词匹配而非精确匹配。映射数组按特异性从高到低排列，确保 "情绪健康" 优先于 "情绪按钮" 等模糊匹配。

