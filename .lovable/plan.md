

## 修复邀请链接使用生产域名

### 问题
当前 CSV 导出和复制链接功能使用 `window.location.origin`，在预览环境下会生成 Lovable 预览域名的链接，而非生产域名 `https://wechat.eugenewe.net`。

### 修改内容

**文件：`src/components/admin/BloomPartnerInvitations.tsx`**

1. 引入 `getPromotionDomain` 工具函数（已有现成的 `src/utils/partnerQRUtils.ts`）
2. 将 CSV 导出中的 `window.location.origin` 替换为 `getPromotionDomain()`
3. 将复制链接的 `handleCopyLink` 中的 `window.location.origin` 也替换为 `getPromotionDomain()`

这样所有生成的邀请链接都会统一使用 `https://wechat.eugenewe.net/invite/BLOOM-XX01` 格式。

