

# 阶段一：/laoge 转化路径统一到 /promo/synergy

## 改动范围（3个文件，纯路由+文案微调，零业务逻辑变更）

### 改动 1：LaogeToolCard 转化卡片跳转
**文件**: `src/components/laoge/LaogeToolCard.tsx` 第 230 行
- `navigate("/promo/zhile-havruta")` → `navigate("/promo/synergy?source=laoge")`
- 其余（文案、按钮样式、"再问老哥一次"）完全不变

### 改动 2：LaogeAI 顶部悬浮条跳转
**文件**: `src/pages/LaogeAI.tsx` 第 82 行
- `navigate("/promo/zhile-havruta")` → `navigate("/promo/synergy?source=laoge")`
- 悬浮条文案、样式不变

### 改动 3：SynergyPromoPage Hero 副标题按 source 微调
**文件**: `src/pages/SynergyPromoPage.tsx` 约第 479-481 行

读取 `searchParams.get("source")`，Hero 区副标题根据来源显示不同文案：

| source 参数 | 副标题 |
|------------|--------|
| `laoge` | "从职场内耗到能量重启，7天专业陪伴" |
| 无/其他 | 保持现有："7天 AI + 专业教练 + 知乐胶囊..." |

页面其余内容（痛点卡片、价格、支付流程、购买后跳转）完全不变。

## 不受影响的内容

- `/promo/zhile-havruta` 页面保留，已有的外部链接、分享链接仍可访问
- 支付流程（微信/支付宝）、订单逻辑、训练营开通逻辑零改动
- 购买后跳转路径仍为 `/camp-intro/emotion_stress_7`，不变
- 手机端/电脑端排版无影响（仅改 URL 字符串 + 一行文案条件判断）

