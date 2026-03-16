

# 新建「知乐·海洛塔双效解压包」推广页

## 产品定位
- **价格**: ¥399
- **权益**: 知乐胶囊 1 瓶 + 海洛塔团队教练辅导 1 次（90min，腾讯会议）
- **目标人群**: 35-55 岁中年男性
- **套餐 key**: `zhile_havruta_bundle`

## 页面结构（参考 SynergyPromoPage 暗色风格）

1. **Hero 区**: 标题「身体调理 × 情绪梳理 双效解压」，副标题强调知乐胶囊+海洛塔90分钟团体辅导，价格 ¥399
2. **痛点共鸣区**: 复用5大中年男性痛点（情绪内耗、关系紧张、职场高压、身心失调、成长受阻）
3. **双效方案区**: 两大核心权益卡片 — 知乐胶囊（草本调理根源）+ 海洛塔团队教练（90min专业情绪梳理）
4. **海洛塔亮点区**: 基于调研PDF — 95%+好评率、35+资深教练团队、高接纳抱持性环境、讲解-分组讨论-分享回应标准化流程
5. **教练团队区**: 黛汐/晓一/Amy/贝蒂等教练核心理念（卡点根源梳理、大脑神经重组、自我觉察与疗愈）
6. **学员见证区**: 基于绽放联盟分享PDF — 苏菲/张艳等学员真实感悟
7. **知乐胶囊区**: 产品规格、资质认证（复用 SynergyPromoPage 的胶囊段落）
8. **购买权益区**: 清晰列出购后获得（1瓶胶囊 + 1次90min辅导 + 企微群入口）
9. **底部 CTA + 吸底购买栏**: ¥399 立即购买

## 技术实现

### 1. 新建数据库套餐（migration）
- 在 `packages` 表插入 `zhile_havruta_bundle`，价格 399，is_active = true

### 2. 新建页面文件
- `src/pages/ZhileHavrutaPromoPage.tsx`
- 复用 SynergyPromoPage 的支付流程架构（环境检测 → CheckoutForm → WechatPay/AlipayPay → 注册 → 成功）
- package_key 改为 `zhile_havruta_bundle`
- 成功面板展示：胶囊已安排发货 + 海洛塔辅导预约说明（客服将通过企微联系安排）
- 无训练营跳转，成功后引导查看订单或返回首页

### 3. 注册路由
- `App.tsx` 中添加 `/promo/zhile-havruta` 路由

### 4. 更新推广中心
- `ZhilePromoHub.tsx` 和 `PartnerPromoPages.tsx` 中添加新卡片
- `postPaymentRedirect.ts` 添加该 key 的处理（回到推广页或订单页）

### 5. 支付后处理
- 复用现有 `update-order-shipping` 边缘函数同步收货信息
- 复用 `notify-store-order` 通知

## 涉及文件
| 文件 | 操作 |
|------|------|
| `src/pages/ZhileHavrutaPromoPage.tsx` | 新建 |
| `src/App.tsx` | 添加路由 |
| `src/pages/ZhilePromoHub.tsx` | 添加卡片 |
| `src/components/partner/PartnerPromoPages.tsx` | 添加卡片 |
| `src/utils/postPaymentRedirect.ts` | 添加 key 映射 |
| 数据库 migration | 插入新套餐记录 |

