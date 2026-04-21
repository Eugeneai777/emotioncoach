

## 重构 /promo/synergy 落地页 · 中年男性专属版（修订版）

只改 1 文件：`src/pages/SynergyPromoPage.tsx`，**纯 UI 与文案重写，业务逻辑零改动**。

### 业务逻辑 100% 保留清单（一行不改）

| 模块 | 保留实现 |
|---|---|
| 支付入口 | 仍弹 `SynergyRedeemDialog`（有赞商城下单 → 拿码 → 回页输入兑换） |
| 兑换核销 | 边缘函数 `redeem-synergy-code` 不动，自动写入 `user_camp_purchases` |
| 已购检测 | `orders.status='paid'` + `user_camp_purchases.payment_status='completed'` 双查 |
| 购后流转 | `autoCreateAndEnterCamp` → 自动建 `training_camps` → `navigate('/camp-checkin/:id')` |
| 学习路径 | 打卡页冥想 / AI 教练 / 每日课程全套继承（`CampCheckIn.tsx` 不碰） |
| 登录回跳 | `pendingRedeemCode` + `setPostAuthRedirect` 自动续兑逻辑保留 |
| 套餐 key | `synergy_bundle` 不变，价格沿用有赞商城原价 |
| 物流入口 | "查看订单与物流" → `/settings?tab=account&view=orders` |
| 助教企微卡 | `wecom-coach-qr.jpg` 二维码卡保留在购后面板 |

### UI 与文案重构（对齐 midlife-men-399 暗金调）

**配色**：bg `#0f0f0f` / 卡 `#221f1b` / 主色暗金 `#d4b481` / 文字 `#ece7dc`  
**字体**：标题 `Noto Serif SC` / 正文无衬线  
**版式**：480px 居中 · 编号制章节（`01 / 11`）· framer-motion 入场

### 章节结构（11 段）

```text
01 HERO          40 岁以后，有些事不该一个人扛着 · FOR MEN 38-55
                 主 CTA「立即加入身心舒展计划」→ setShowRedeemDialog(true)
02 痛点共鸣      5 条男性独白 quote（身体亮黄灯/不敢声张/装作没事…）
03 7 天交付清单  4 卡：海沃塔团队 / 知乐胶囊实物 / AI 男士教练 / 中年专属社群
04 每日闭环      5 步纵向时间轴：冥想→AI对话→反思→课程→胶囊
05 知乐胶囊详解  ★ 完整保留：实拍图 + specs + HKC-18181 + 香港直邮
06 教练师资      ★ 黛汐 C 位大卡 + 5 位教练（晓一/肖剑雄/Amy/木棉/贝蒂）横滑
07 3 大核心优势  极致隐私 / 轻量无负担 / 高性价比
08 信任承诺      4 条隐私承诺 + 顶部「22 年施强健康 · 0 朋友圈曝光」徽章
09 同龄人证言    4 张证言卡（精炼为中年男性视角）
10 FAQ           4 问折叠：课程安排 / AI 教练 / 兑换码流程 / 隐私
11 价格 + CTA    暗金大卡，双 CTA：
                 主：立即加入（→ SynergyRedeemDialog）
                 副：已有兑换码？立即兑换（→ SynergyRedeemDialog）
```

底部 Sticky CTA 永久显示「立即加入身心舒展计划」→ 触发同一个 `setShowRedeemDialog(true)`。

### 已购态保留 SuccessPanel

用户已购时仍渲染当前的 `SuccessPanel`（含「知乐胶囊已发货」「7 天有劲训练营已开通」「添加助教企微」「进入有劲训练营」按钮），仅微调配色暗金一致，按钮逻辑 `onEnterCamp = handleEnterCamp = autoCreateAndEnterCamp` 不变。

### 文案核心

- HERO 主标：「40 岁以后，有些事不该一个人扛着」
- 副标：「38–55 岁男人的 7 天身心舒展计划 · 没人会知道你来过」
- 入口徽章：「施强健康 ✕ 有劲AI · 含知乐胶囊实物」
- FAQ「兑换码流程」明确告知：下单后到手兑换码 → 回此页输入 → 自动开营 → 直达打卡页

### 验证标准

1. 桌面 1085 / 移动 480 排版无溢出，整体暗金调
2. 知乐胶囊实拍图 + HKC-18181 资质完整可见
3. 黛汐 C 位 + 5 教练横滑卡正常渲染
4. 任何 CTA 点击 → 仍弹 `SynergyRedeemDialog`（有赞 / 兑换码二选一）
5. 输入正确兑换码后 → 自动建营 → 跳 `/camp-checkin/:id`，可正常冥想/AI互动/学课程
6. 已购用户访问 → 直接渲染 SuccessPanel（含发货信息 + 进入训练营按钮）
7. 助教企微二维码、物流入口、登录续兑逻辑全部保留

