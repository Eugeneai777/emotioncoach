我会只在指定的全屏 promo 落地页加“页面内白色返回箭头”，不改已有 `PageHeader` 的普通训练营页，确保不影响现有业务逻辑。

实施范围：

1. 新增一个复用的悬浮返回箭头组件
   - 左上固定显示，样式为白色返回箭头。
   - 使用安全区适配鸿蒙手机微信小程序：`top: calc(env(safe-area-inset-top) + 12px)`。
   - 点击区域保持移动端友好，至少 44px。
   - 背景使用轻微半透明深色圆形底，保证白色箭头在黑金、紫色、深色首屏上都清楚可见。

2. 返回逻辑
   - 优先尝试微信小程序 `window.wx?.miniProgram?.navigateBack()`。
   - 如果不可用或失败，则执行网页历史返回。
   - 如果没有可返回历史，则按来源参数兜底：
     - `source=laoge` 返回 `/laoge`
     - `source=mama` 返回 `/mama`
     - 其他情况返回 `/mini-app`

3. 应用到这些页面
   - `src/pages/SynergyPromoPage.tsx`
   - `src/pages/IdentityBloomPromoPage.tsx`
   - `src/pages/PromoMidlifeMen399.tsx`
   - `src/pages/PromoMidlife25to45Women399.tsx`
   - `src/pages/PromoMidlifeMen3980.tsx`

4. 明确不改这些页面
   - 不给 `/camp-intro/:campType` 对应的 `CampIntro` 添加悬浮返回按钮，因为它已经有 `PageHeader showBack`。
   - 不改购买、兑换码、支付恢复、分享、已购进入训练营等现有逻辑。

5. 验证目标
   - 从老哥 AI 页面点击“7天有劲训练营”进入 `/promo/synergy?source=laoge` 后，鸿蒙微信小程序内左上角可见页面内白色返回箭头。
   - 点击返回后可回到老哥 AI 页面；历史栈异常时也能兜底回 `/laoge`。
   - 各 promo 页首屏 CTA、标题、分享/购买弹窗不受影响。