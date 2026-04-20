

# 落地「中年男性 ¥399 体验营」React 售前页

## 路由
新增 `/promo/midlife-men-399`，与 `/promo/midlife-men-3980` 形成 **399 → 3980 转化闭环**。

## 视觉风格（与 3980 海报一致）
- 深色高级质感：炭黑 `#1a1a1a` / 暖金 `#c9a876` / 暗酒红 `#6b2c2c`
- 衬线大标题 + 无衬线正文，模块编号 `01/09 … 09/09`
- framer-motion fade-in，移动优先 `max-w-[480px]`
- 与 3980 页同款排版语言，但**色温稍亮**（多用暖金）以体现"低门槛试听"轻盈感

## 页面结构（对应已批准 v2 文字版 9 模块）
1. **Hero**：「40 岁以后那点难言之隐 / 一杯酒钱先和同龄人聊一次吗」+ 信任背书条
2. **痛点共鸣**：5 条"咽下去过的话"
3. **体验营定位**：「我们不教知识，我们陪你敢面对」
4. **7 天交付路径**：海沃塔团队对话 / 每日冥想 / AI 男士教练（3 张交付卡片）
5. **¥399 权益清单**：6 条 ✓ 列表
6. **同龄人证言**：3 条化名引用（含李先生 → 3980 升舱证言）
7. **隐私承诺**：5 条 🔒 信任条
8. **升舱钩子**：¥399 全额抵扣 ¥3980（暖金描边强调卡片）
9. **价格区 + 双 CTA**（sticky 底部主 CTA）：
   - 主按钮「立即开通体验营」→ `UnifiedPayDialog`，packageKey `camp-emotion_stress_7`（¥399 / 7 天，对应 mem://product/camp/pricing-and-entitlement-standard-zh-v3）
   - 次按钮「先和顾问聊 5 分钟」→ `/customer-support`

## 技术要点
- 单文件 `src/pages/PromoMidlifeMen399.tsx`（结构与 3980 页 1:1 复用，仅文案/包号/路由不同）
- 在 `src/App.tsx` 注册 `/promo/midlife-men-399`，使用 `lazyRetry`
- 复用 `UnifiedPayDialog` / `usePaymentCallback` / `useAuth` / `setPostAuthRedirect`
- 支付成功跳 `/camp-intro/emotion_stress_7`（已存在的 7 天解压营 intro，与海沃塔交付一致）
- 升舱钩子卡片底部加一行小字超链 → `/promo/midlife-men-3980`，把 399 用户天然导向 3980 页
- `?ref=partnerCode` 由全局 `GlobalRefTracker` 自动归因

## 不做
- 不改产品价格 / 不动 emotion_stress_7 套餐配置
- 不生成图片素材（继续纯排版 + 几何）
- 不输出公众号正文（如需另起一轮）

## 交付后验证建议
- 移动端 H5 真机预览（公众号内 / 浏览器内）
- 主 CTA 在微信内是否正确唤起 JSAPI 支付
- 升舱钩子点击是否正确跳 3980 页
- 未登录态点击主 CTA 是否带 `?redirect=/promo/midlife-men-399` 回跳

