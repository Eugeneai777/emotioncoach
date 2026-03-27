

# 已购用户隐藏转化卡片

## 问题

3轮对话完成后，所有用户（包括已购买7天有劲训练营的学员）都会看到跳转 `/promo/synergy` 的推荐卡片。对已购学员来说，这个推荐毫无意义甚至造成困扰。

## 方案

在 `LaogeToolCard.tsx` 中引入 `useCampPurchase('emotion_stress_7')` 检查用户是否已购买。根据购买状态，转化卡片展示不同内容：

| 用户类型 | 显示内容 |
|---|---|
| 未购买 / 游客 | 当前转化卡片（跳转 /promo/synergy） |
| 已购买 | 替换为"进入训练营"按钮，直接跳转打卡页；或仅显示"再问老哥一次" |

## 具体实现

1. **引入购买状态**：在 `LaogeToolCard.tsx` 顶部引入 `useCampPurchase`，查询 `emotion_stress_7` 购买记录
2. **条件渲染**：第 221-252 行的转化卡片区域，增加 `if (purchaseData)` 判断：
   - **已购买**：显示"✅ 已在训练中"提示 + "继续训练"按钮（跳转 `/camp-checkin`）
   - **未购买**：保持当前转化卡片不变
3. **游客处理**：未登录用户 `useCampPurchase` 返回 null，视为未购买，正常展示转化卡片

## 改动文件

仅 `src/components/laoge/LaogeToolCard.tsx`

## 不受影响

- `/laoge` 顶部快通道悬浮条（那里已有独立的购买检测逻辑）
- AI 对话流程、3轮交互逻辑
- `/promo/synergy` 落地页

