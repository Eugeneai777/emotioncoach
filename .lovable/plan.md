## 商业架构师视角评估

当前 `/emotion-health` 已改为免费测评，作为引流入口。结果页是关键转化节点。三项优化分别承担：**用户沉淀（登录）→ 付费转化（推荐测评）→ 私域沉淀（助教企微）**，构成完整漏斗。

---

## 改动一：结果页登录门槛

**商业逻辑**：免费测评吸引流量，但必须通过登录把用户沉淀到自有账号体系（手机号/微信），否则流量浪费。答完题再要求登录，沉没成本最大化，转化率最高。

**实现**：
- 在 `src/pages/EmotionHealthPage.tsx` 和 `EmotionHealthLite.tsx` 中，`pageState === "result"` 渲染前判断 `user`：
  - 未登录 → 渲染登录引导卡（"答题成果已生成，登录后立即查看完整报告"），CTA 跳 `/login?redirect=/emotion-health&restore=1`
  - 答案缓存到 `sessionStorage`（参考 `mem://features/assessment/state-persistence-pattern-zh`），登录回跳后自动恢复并展示结果
- 已登录 → 直接展示结果（行为不变）

---

## 改动二：替换底部按钮为付费测评推荐

**商业逻辑**：
- "查看完整成长支持路径" 是站内导航，无变现价值，去除
- 替换为两张高客单测评推荐卡，承接情绪健康人群的两大延伸需求：
  - **35+女性竞争力测评**（`/assessment/women_competitiveness`）— 命中"中年情绪压力多源自职场/角色焦虑"的女性用户
  - **财富卡点测评**（`/wealth-block-intro`）— 命中"情绪压力背后是经济/财富焦虑"的全性别用户
- 保留"7天情绪压力训练营"按钮（¥399 主转化路径不变）

**实现**：在 `src/components/emotion-health/EmotionHealthResult.tsx` 第 261-270 行，删除"查看完整成长支持路径"按钮，替换为两张推荐卡（emoji + 标题 + 简介 + 立即测评 CTA），样式参考 `MarriageAssessmentCards.tsx` 的渐变卡风格。

---

## 改动三：助教企微二维码

**商业逻辑**：免费测评 → 私域 → 1v1 转化是标准漏斗。当前 `QiWeiQRCard` 是"客服"定位，新增"助教"卡片定位为"答疑/推荐课程"，更贴近测评后场景。

**实现**：
- 上传的二维码图片保存为 `src/assets/qiwei-assistant-qr.jpg`
- 新建 `src/components/emotion-health/AssistantQRCard.tsx`（参考 `QiWeiQRCard` 结构，文案改为"添加助教企微，获取你的个性化情绪疏导方案"，小程序内显示"截屏后用企业微信扫码"）
- 在结果页"统一承接区"卡片（CTA 按钮下方）插入助教卡，让用户在最高情绪共鸣点接触助教

---

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/pages/EmotionHealthPage.tsx` | 结果页前加登录门槛 + sessionStorage 答案恢复 |
| `src/pages/EmotionHealthLite.tsx` | 同上 |
| `src/components/emotion-health/EmotionHealthResult.tsx` | 移除成长路径按钮 → 两张测评推荐卡；插入助教二维码 |
| `src/components/emotion-health/AssistantQRCard.tsx` | 新建 |
| `src/assets/qiwei-assistant-qr.jpg` | 新建（用户上传图） |

---

## 风险与说明

- **登录门槛会折损完播率**，但沉淀质量高，符合"先免费后转化"商业模型；如希望更宽松，可改为只对"分享"和"AI 教练"功能加门槛，结果页保持开放——请你确认采用哪种力度。
- 财富卡点测评是付费测评，会与"7 天训练营 ¥399"在结果页同时存在，按 **¥9.9 → ¥399 阶梯** 排序：先小额测评，后训练营，避免互相压制。
