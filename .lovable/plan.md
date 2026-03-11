

# 知乐产品页两大问题修复 + 用户体验全链路优化

## 问题分析

### 问题1：产品信息不准确
涉及多个页面中知乐胶囊的描述需要修正：
- **每瓶粒数**：WealthSynergyPromoPage 写的是"90粒"→ 应改为"84粒"
- **核心成分**：写的是"GABA + 茶氨酸"→ 应改为"16味草本精华科学配比"
- **晚间服用时间**：PromoPage 写的是"晚餐后"→ 应改为"下午5:00-6:00"，且描述不应是"安稳入睡"（会误导用户以为是助眠产品）
- WealthSynergyPromoPage timeline 中 19:00 晚餐后服用 → 改为 17:00-18:00

### 问题2：微信端支付慢且失败
根据代码分析，微信浏览器中购买知乐胶囊的流程是：`CheckoutForm`（填地址）→ `UnifiedPayDialog` → `WechatPayDialog`。问题在于：
1. **微信环境下获取 openId 流程太慢**：需要先静默授权跳转微信OAuth，再回跳，再用code换openId，整个过程涉及多次网络请求和页面跳转
2. **openId 获取是在打开支付弹窗后才触发的**，用户填完地址点"确认并支付"后还要等很久
3. **优化方案**：在用户填写地址的阶段就预先获取 openId（预热），这样打开支付弹窗时 openId 已经就绪，可以立即创建订单并调起支付

## 改动计划

### 文件1：`src/pages/WealthSynergyPromoPage.tsx`
- L108: `"90粒"` → `"84粒"`
- L111: `"GABA + 茶氨酸"` → `"16味草本精华科学配比"`
- L110: 持续天数 `"30天"` → `"28天"`（84粒/每日3粒）
- L95: timeline 晚餐后时间 `"19:00"` → `"17:00"`，描述改为"知乐胶囊 × 1次（建议17-18点服用）"

### 文件2：`src/pages/PromoPage.tsx`
- L280: 标签从"每日3次"保持不变
- L289: 晚餐后的时间和描述修改：
  - `time`: `"晚餐后"` → `"下午 5:00-6:00"`
  - `icon`: 保持 Moon 或改为 Clock
  - `desc`: `"安稳入睡"` → `"稳定情绪，为晚间放松做准备"`

### 文件3：`src/pages/ZhileProductsPage.tsx`
- 各人群的胶囊描述更新，加入"每瓶84粒"和"16味草本精华"关键词
- 产品描述统一优化，体现核心卖点

### 文件4：`src/pages/ZhileProductsPage.tsx` — 微信支付预热优化
- 在 `ZhileProductsPage` 组件中，当用户点击胶囊产品打开 `CheckoutForm` 时，同步预获取微信 openId
- 新增 `useWechatOpenIdPreload` 逻辑：检测微信环境后，提前从数据库或触发静默授权获取 openId
- 将获取到的 openId 通过 props 传给 `UnifiedPayDialog` → `WechatPayDialog`，跳过弹窗内的 openId 获取流程

### 文件5：`src/components/UnifiedPayDialog.tsx`
- 新增 `openId` prop 透传（已存在，确保 ZhileProductsPage 传入）

### 文件6：`src/components/WechatPayDialog.tsx` — 支付速度优化
- 当 `propOpenId` 已传入时，跳过所有 openId 获取逻辑，直接标记 `openIdResolved = true` 并创建订单
- 减少不必要的等待时间

### 用户体验全链路审视

**查看链路**：ZhileProductsPage 选人群 → 看推荐 ✅ 流畅

**购买链路优化**：
- 点击胶囊 → 填地址（同时后台预获取openId）→ 确认 → 支付弹窗秒开并直接调起微信支付
- 预计将支付等待时间从 5-8秒 缩短到 1-2秒

**购后链路**：支付成功 → toast提示 → 收货信息自动写入订单 ✅ 已实现

**订单查询**：设置 → 账户 → ShippingTracker ✅ 已实现

