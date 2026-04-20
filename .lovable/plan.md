

# 落地「中年男性 3980 闭门修复计划」React 售前页

## 路由
新增页面 `/promo/midlife-men-3980`，独立全屏长页，不进任何导航菜单。

## 视觉风格（与海报一致 + 网页化）
- 深色高级质感：炭黑底 `#1a1a1a` / 暖金主色 `#c9a876` / 暗酒红强调 `#6b2c2c`
- 衬线大标题 + 无衬线正文，模块编号 `01/09 … 09/09`，暖金分隔线
- 每模块 fade-in 滚动动效（framer-motion，已在项目内）
- 移动优先（公众号 H5 投放为主），桌面居中限宽 `max-w-[480px]`

## 页面结构（一一对应已批准 9 模块）
1. Hero：主副标题 + 信任背书条
2. 痛点共鸣：5 条"咽下去过的话"列表
3. 风险升维："身体退一步 → … → 关系退十步" 阶梯图
4. 隐秘修复计划：3 步闭环卡片（身体重启 / 心理重建 / 关系修复）
5. 6 大闭门专题：编号卡片栅格
6. 交付清单：6 条 ✓ 列表（金色描边卡片）
7. 同龄人证言：3 条化名引用卡片
8. 隐私与承诺：4 条 ✓ 信任条
9. 价格区 + 双 CTA（浮动底部 sticky 主 CTA）：
   - 主按钮「锁定我的席位」→ 复用 `UnifiedPayDialog`，packageKey `identity_bloom`（¥3980，已存在产品体系，对应 mem://product/mini-app/identity-bloom-high-value-gate-zh）
   - 次按钮「先和顾问 1 对 1 聊聊」→ 跳 `/customer-support`

## 技术要点
- 单文件组件 `src/pages/PromoMidlifeMen3980.tsx`
- 在 `src/App.tsx` 注册路由 `/promo/midlife-men-3980`
- 复用：`UnifiedPayDialog`、`usePaymentCallback`、`useAuth`；登录态缺失时 CTA 跳 `/auth?redirect=/promo/midlife-men-3980`
- 带 `?ref=partnerCode` 时由全局 `GlobalRefTracker` 自动归因（无需在本页处理）
- 不改动产品价格 / 不新增数据表 / 不动 partner 体系

## 不做
- 不生成图片素材（继续走纯排版 + 几何）
- 不改动现有 identity_bloom 套餐配置
- 不接微信公众号正文输出（如需要后续单独一轮）

## 交付后验证建议
- 移动端 H5 真机预览
- 微信内点击主 CTA 是否正确唤起 JSAPI 支付
- 未登录态点击主 CTA 是否带 redirect 回跳

