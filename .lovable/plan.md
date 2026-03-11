

# 推广页产品信息修正 + 微信支付优化 + 知乐订单数据看板

## 问题总览

1. **产品信息错误**：WealthSynergyPromoPage、SynergyPromoPage、PromoPage 三个推广页中知乐胶囊的规格、成分、服用时间描述不准确
2. **微信支付慢/失败**：WealthSynergyPromoPage 和 SynergyPromoPage 未传 openId 给 UnifiedPayDialog，导致每次支付都要走完整静默授权流程（5-8秒）
3. **缺少知乐订单数据看板**：管理后台数据看板目前只有手动录入的运营指标，缺少知乐胶囊的订单+物流数据视图，合作方无法便捷查看发货信息

---

## 修改计划

### 1. 产品信息修正（3个文件）

**`src/pages/WealthSynergyPromoPage.tsx`**
- L108: `"90粒"` → `"84粒"`
- L110: `"30天"` → `"28天"`
- L111: `"GABA + 茶氨酸"` → `"16味草本精华科学配比"`
- L95: timeline `"19:00"` → `"17:00"`，label `"晚餐后服用"` → `"下午服用"`，desc 改为 `"知乐胶囊 × 1次（建议17-18点）"`
- L443: `"30天调理周期"` → `"28天调理周期"`
- L624: `"30天套餐"` → `"28天套餐"`
- L660: 同上

**`src/pages/SynergyPromoPage.tsx`**
- 同上对应行：specs 数组、timeline 数组、"30天调理周期"、"30天套餐"

**`src/pages/PromoPage.tsx`**
- L289: `time: "晚餐后"` → `"下午 5:00-6:00"`，`desc: "安稳入睡"` → `"稳定情绪，为晚间放松做准备"`，icon 改为 Clock

### 2. 微信支付 openId 预加载（2个文件）

**`src/pages/WealthSynergyPromoPage.tsx`** 和 **`src/pages/SynergyPromoPage.tsx`**

当用户点击"购买"进入 checkout 步骤时，同步预获取 openId：
- 检测微信环境 → 查 `wechat_user_mappings` 表获取已绑定 openId
- 若无，检查 sessionStorage 缓存 `wechat_payment_openid`
- 将获取到的 openId 通过 `openId` prop 传给 `UnifiedPayDialog`

```typescript
// 在 step 变为 'checkout' 时触发预加载
useEffect(() => {
  if (step !== 'checkout') return;
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  if (!isWechat || paymentOpenId) return;
  
  // 1. 检查缓存
  const cached = sessionStorage.getItem('wechat_payment_openid');
  if (cached) { setPaymentOpenId(cached); return; }
  
  // 2. 已登录用户查数据库
  if (user) {
    supabase.from('wechat_user_mappings')
      .select('openid')
      .eq('system_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.openid) {
          setPaymentOpenId(data.openid);
          sessionStorage.setItem('wechat_payment_openid', data.openid);
        }
      });
  }
}, [step, user]);
```

然后在 `<UnifiedPayDialog>` 上添加 `openId={paymentOpenId}`：
```tsx
<UnifiedPayDialog
  open={step === 'payment'}
  ...
  openId={paymentOpenId}
/>
```

### 3. 知乐订单数据看板（新组件 + 集成）

**新建 `src/components/partner/ZhileOrdersDashboard.tsx`**

从 `orders` 表查询知乐相关订单（`package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')`且 `status = 'paid'`），展示：

- **汇总卡片**：总订单数、待发货、已发货、已完成
- **订单列表表格**：订单号、用户昵称、收货人、手机号、地址、金额、物流状态、下单时间
- **物流操作**：管理员可更新 shipping_status（待发货→已发货→已完成）和 shipping_note（快递单号）
- **导出 CSV**：一键导出所有订单含物流信息

**集成到管理后台 `src/components/admin/industry-partners/IndustryPartnerDetail.tsx`**

在 "数据看板" TabsContent 中，将 `ZhileOrdersDashboard` 作为新的 section 追加到 `PartnerSharedDataDashboard` 下方，或作为看板内的独立区块。

### 4. 全链路用户体验审查

修改完成后，确保以下链路通畅：

```text
浏览推广页 → 产品信息准确(84粒/28天/16味草本/17:00服用)
    ↓
点击购买 → CheckoutForm(填地址，同时预获取openId)
    ↓
确认支付 → UnifiedPayDialog(openId已就绪，秒级调起支付)
    ↓
支付成功 → 收货信息写入orders表 → 成功页(进入训练营/查看物流)
    ↓
用户端查询 → 设置→账户→ShippingTracker(显示物流状态)
    ↓
管理端查看 → 数据看板→知乐订单(收货信息/发货操作/CSV导出)
```

