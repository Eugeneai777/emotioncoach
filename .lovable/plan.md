

## 全站分享按钮完整审计与统一管理方案

### 当前状态总览

通过全面搜索发现项目中有 **25+ 个分享功能**，分布在以下几个场景：

| 场景 | 分享组件/功能 | 当前状态 |
|:-----|:-------------|:---------|
| 🏕️ 训练营打卡 | `CampShareDialog` | ⚠️ 未注册 |
| 📋 简报分享 | `BriefingShareDialog` | ⚠️ 未注册 |
| 📔 感恩日记 | `GratitudeJournalShareDialog` | ⚠️ 未注册，使用旧版 QR |
| 💬 社区帖子 | `ShareButton` / `PostDetailSheet` | ✅ 部分合规 |
| 🆘 情绪急救 | `EmotionButtonShareDialog` | ⚠️ 未注册 |
| 💗 安全打卡 | `AliveCheckShareDialog` | ⚠️ 未注册 |
| 🎨 海报中心 | `PosterCenter` / `PosterGenerator` | ✅ 已注册，旧版实现 |
| ⚡ 能量宣言 | `EnergyDeclaration` | ✅ 已注册，旧版实现 |
| 📊 周报导出 | `WeeklyTagReport` | ✅ 已注册，旧版实现 |
| 👨‍👩‍👧 青少年邀请 | `TeenInviteShareDialog` | ✅ 已注册，部分合规 |
| 🚀 合伙人 | `PartnerPlanShareCard` | ✅ 已注册，部分合规 |
| 🧠 SCL-90 | `SCL90ShareDialog` | ✅ 完全合规 |
| ❤️‍🩹 情绪健康 | `EmotionHealthShareDialog` | ✅ 完全合规 |
| 📖 介绍页(17个) | `IntroShareDialog` | ✅ 完全合规 |
| 💰 财富日记 | `WealthJournalShareDialog` | ⚠️ 需验证 |
| 🏆 成就墙 | `AchievementShareCard` | ⚠️ 需验证 |
| 🎓 毕业证 | `GraduationShareCard` | ⚠️ 需验证 |

---

### 发现的核心问题

#### 1. 未注册到 `shareCardsRegistry.ts` 的分享功能

以下 **6 个分享组件** 未在统一管理后台显示：

| 组件 | 文件位置 | 问题描述 |
|:-----|:---------|:---------|
| `CampShareDialog` | `src/components/camp/CampShareDialog.tsx` | 训练营打卡分享，分享到社区而非生成图片 |
| `BriefingShareDialog` | `src/components/briefing/BriefingShareDialog.tsx` | 教练简报分享，分享到社区 |
| `GratitudeJournalShareDialog` | `src/components/gratitude/GratitudeJournalShareDialog.tsx` | 感恩日记分享，使用旧版 `QRCode` 库 |
| `EmotionButtonShareDialog` | `src/components/tools/EmotionButtonShareDialog.tsx` | 情绪急救分享 |
| `AliveCheckShareDialog` | `src/components/tools/AliveCheckShareDialog.tsx` | 安全打卡分享 |
| `WealthJournalShareDialog` | `src/components/wealth-camp/WealthJournalShareDialog.tsx` | 财富日记分享 |

#### 2. 未更新到 `ShareButtonAuditPanel.tsx` 审计面板

当前审计面板只追踪 **9 个分享功能**，遗漏了上述 6 个及其他组件。

#### 3. QR 码库使用不统一

发现 `GratitudeJournalShareDialog` 直接使用 `QRCode.toDataURL()` 而非统一的 `useQRCode` hook。

---

### 修复方案

#### 步骤 1：扩展 `shareCardsRegistry.ts` 添加缺失卡片

```typescript
// 新增分享功能注册
{
  id: 'camp-checkin',
  title: '训练营打卡分享',
  category: 'result',
  emoji: '🏕️',
  type: 'result',
  componentName: 'CampShareDialog',
  description: '训练营每日打卡分享到社区',
},
{
  id: 'briefing-share',
  title: '教练简报分享',
  category: 'result',
  emoji: '📋',
  type: 'result',
  componentName: 'BriefingShareDialog',
  description: '教练对话简报分享到社区',
},
{
  id: 'gratitude-journal',
  title: '感恩日记分享',
  category: 'tool',
  emoji: '📔',
  type: 'result',
  componentName: 'GratitudeJournalShareDialog',
  description: '感恩日记推广海报',
},
{
  id: 'emotion-button-share',
  title: '情绪急救分享',
  category: 'tool',
  emoji: '🆘',
  type: 'result',
  componentName: 'EmotionButtonShareDialog',
  description: '情绪急救工具分享',
},
{
  id: 'alive-check-share',
  title: '安全打卡分享',
  category: 'tool',
  emoji: '💗',
  type: 'result',
  componentName: 'AliveCheckShareDialog',
  description: '安全打卡功能分享',
},
{
  id: 'wealth-journal-share',
  title: '财富日记分享',
  category: 'result',
  emoji: '💰',
  type: 'result',
  componentName: 'WealthJournalShareDialog',
  description: '财富觉察日记分享',
},
```

#### 步骤 2：扩展 `ShareButtonAuditPanel.tsx` 审计列表

将上述 6 个组件添加到 `KNOWN_SHARE_FEATURES` 数组，并标注各自的合规状态。

#### 步骤 3：修复 `GratitudeJournalShareDialog` 使用统一 QR 库

```typescript
// 当前（不合规）
import QRCode from "qrcode";
const url = await QRCode.toDataURL(shareUrl, {...});

// 修复后（合规）
import { useQRCode } from '@/utils/qrCodeUtils';
const { qrCodeUrl } = useQRCode(shareUrl, 'SHARE_CARD');
```

#### 步骤 4：更新一致性检查列表

在 `shareCardConsistencyCheck.ts` 的 `COMPLIANT_CARDS` 添加新卡片。

#### 步骤 5：更新组件路径映射

在 `ShareCardConsistencyPanel.tsx` 的 `COMPONENT_PATHS` 添加新组件路径。

---

### 涉及文件汇总

| 操作 | 文件 | 修改内容 |
|:-----|:-----|:---------|
| 修改 | `src/config/shareCardsRegistry.ts` | 添加 6 个缺失的分享组件注册 |
| 修改 | `src/components/admin/ShareButtonAuditPanel.tsx` | 扩展审计列表，新增 6+ 审计项 |
| 修改 | `src/utils/shareCardConsistencyCheck.ts` | 添加新卡片到合规检查列表 |
| 修改 | `src/components/admin/ShareCardConsistencyPanel.tsx` | 添加新组件路径映射 |
| 修改 | `src/components/gratitude/GratitudeJournalShareDialog.tsx` | 替换为统一 `useQRCode` hook |

---

### 分享功能分类说明

项目中的分享功能分为两类：

#### A. 社区分享型（发布到有劲社区）
- `CampShareDialog` - 训练营打卡
- `BriefingShareDialog` - 教练简报
- `PostComposer` - 社区发帖

这类组件主要功能是**发布内容到社区**，而非生成分享图片。

#### B. 图片分享型（生成海报/卡片）
- `SCL90ShareDialog` - 测评结果
- `EmotionHealthShareDialog` - 情绪健康结果
- `WealthJournalShareDialog` - 财富日记
- `PartnerPlanShareCard` - 合伙人海报
- 等等...

这类组件使用 `executeOneClickShare` 或 `generateCardBlob` 生成图片。

---

### 统一规范核对清单

每个分享功能应满足：

| 检查项 | 标准 | 检查方法 |
|:-------|:-----|:---------|
| 已注册 | 在 `shareCardsRegistry.ts` 中有记录 | 搜索组件名 |
| 统一模块 | 使用 `executeOneClickShare` 或 `useOneClickShare` | 检查 import |
| 统一 QR | 使用 `useQRCode` hook | 检查是否直接使用 `qrcode` 库 |
| 统一域名 | 使用 `getPromotionDomain()` | 检查 URL 生成方式 |
| 品牌标识 | "Powered by 有劲AI" | 检查 footer 文案 |
| 宽度规范 | 结果类 340px，工具类 420px | 检查卡片容器宽度 |

---

### 预期效果

1. **管理后台** `/admin/share-cards` 可查看全部 30+ 分享卡片
2. **审计面板** 显示所有分享功能的合规状态
3. **一致性检查** 覆盖全部卡片组件
4. **新开发规范** 明确的注册流程和合规标准

