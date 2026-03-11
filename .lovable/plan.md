

# 修复方案：认证文案 + 人群定位 + 新用户支付

## 问题诊断

### 问题 1：认证文案错误
`SynergyPromoPage.tsx` 第 598 行和 `WealthSynergyPromoPage.tsx` 第 500 行写了"国家食药监认证"，需改为"香港HKC认证"。

### 问题 2：缺乏人群定位
当前推广页通用定位（职场人），需强化中年男性痛点：职场晋升、夫妻关系、亲子代沟。参考用户上传的文案，突出海沃塔教练课程在沟通和自信重塑方面的权威性。

### 问题 3：新用户微信支付卡在"正在跳转微信授权"
截图显示 `WechatPayDialog` 的 `triggerSilentAuth()` 被调用后，`isRedirectingForOpenId = true` 导致显示 spinner，但 `window.location.href = data.authUrl` 未能成功跳转（可能被微信安全策略拦截或 auth URL 生成失败）。**没有超时回退机制**，用户永远卡在 spinner。

**根因**：`triggerSilentAuth` 在设置 `setIsRedirectingForOpenId(true)` 后如果重定向失败，没有任何超时机制来恢复 UI。即使重定向成功，页面也应该已经离开，但如果被拦截（如微信版本限制），用户就无法操作了。

## 修改方案

### 1. 文案修复（2 个文件）
- `SynergyPromoPage.tsx` 第 598 行："国家食药监认证" → "香港HKC认证"
- `WealthSynergyPromoPage.tsx` 第 500 行：同上

### 2. 中年男性人群定位（`SynergyPromoPage.tsx`）
更新以下内容以聚焦中年男性：

**Pain Points 数据**：
```typescript
const painPoints = [
  { icon: Activity, stat: "78%", label: "中年男性职场压力超负荷", desc: "晋升焦虑、绩效压力、开会心跳加速", color: "#f87171" },
  { icon: Moon, stat: "65%", label: "夫妻关系紧张难以入睡", desc: "沟通不畅、争吵后躺下越想越焦虑", color: "#a78bfa" },
  { icon: Coffee, stat: "83%", label: "亲子代沟加剧倦怠感", desc: "孩子不听话、沟通无效、靠忍耐硬撑", color: "#fbbf24" },
];
```

**Testimonials 数据**：更新为中年男性用户案例（职场经理、企业主等）

**Hero 文案**：副标题加入"专为中年男性设计"定位

**新增权威背书 Section**：在双引擎板块下方增加教练资质说明，突出专业性

### 3. 微信授权超时回退（`WechatPayDialog.tsx`）
在 `triggerSilentAuth` 函数中加入 **5 秒超时**机制：如果 5 秒后页面未跳转（说明重定向被拦截），自动将 `isRedirectingForOpenId` 重置为 false，`openIdResolved` 设为 true，回退到二维码/扫码支付模式。

```typescript
// triggerSilentAuth 中添加：
// 5 秒后如果页面还在（说明重定向失败），回退到扫码支付
setTimeout(() => {
  setIsRedirectingForOpenId(false);
  silentAuthTriggeredRef.current = false;
  sessionStorage.removeItem("pay_auth_in_progress");
  setOpenIdResolved(true); // 降级为扫码支付
  console.log('[Payment] Silent auth redirect timeout, falling back to native payment');
}, 5000);
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | 认证文案 + 人群定位（痛点/用户故事/hero文案） |
| `src/pages/WealthSynergyPromoPage.tsx` | 认证文案修复 |
| `src/components/WechatPayDialog.tsx` | triggerSilentAuth 添加 5 秒超时回退 |

