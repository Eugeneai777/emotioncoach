

## 简化 WealthInviteCardDialog：从 6 个标签精简到 3 个固定模板

### 当前问题

WealthInviteCardDialog 组件有 **780 行代码**，显示 6 个只有 emoji 图标的小标签（🎁🔓👁️✨🏕️🏅），用户很难理解每个标签代表什么。其中 3 种卡片（情绪锁🔓、盲区👁️、转变✨）**没有任何调用方使用过**，属于冗余功能。成就墙卡片还额外有"风格选择器"和"路径选择器"，增加了不必要的操作复杂度。

### 改造方案

#### 1. 保留 3 种核心卡片

根据全部 5 个调用方的实际使用情况，只保留以下 3 种模板：

| 模板 | 说明 | 调用场景 | 二维码链接 |
|------|------|----------|-----------|
| 测评结果 🎁 | 财富觉醒指数 + 反应模式 | 测评完成页、结果页 | /wealth-block |
| 训练营邀请 🏕️ | 7天训练营进度 + 邀请 | 训练营打卡页 | /wealth-camp-intro |
| 成就墙 🏅 | 成就徽章展示 | 成就页、毕业页 | /wealth-camp-intro |

**删除 3 种不用的卡片**（从此对话框中移除导入，文件本身保留不删）：
- FearAwakeningShareCard（情绪锁）
- BlockRevealShareCard（盲区）
- TransformationValueShareCard（转变）

#### 2. 选择器 UI 改造

将 6 个小 emoji 图标替换为 3 个清晰的大按钮，包含图标和文字标签：

```text
+----------------------------------+
|  生成分享卡片                  X  |
+----------------------------------+
|                                  |
|  [🎁 测评结果] [🏕️ 训练营] [🏅 成就墙]  |
|                                  |
|  +----------------------------+  |
|  |                            |  |
|  |      卡片预览（缩放显示）    |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  [  分享  ]                [复制] |
|  点击分享按钮，或复制链接后发送    |
+----------------------------------+
```

#### 3. 成就墙卡片固定模板

移除当前的风格选择器（深邃/渐变/简约/霓虹）和路径选择器（里程碑/坚持/成长/社交），使用固定默认值：
- 风格：`dark`（深邃）
- 路径：`null`（显示全部）

#### 4. 二维码与署名自动处理

不需要改动 -- 现有的 `useQRCode` + `getPromotionDomain()` + `partnerInfo` 已在各卡片组件内自动生成二维码和合伙人归因链接。本次重构完整保留这些逻辑。

#### 5. 迁移到 ShareDialogBase

利用上一轮已建好的 `ShareDialogBase` 统一处理：
- 图片生成（html2canvas）
- 环境检测（微信/iOS/桌面）
- 滚动锁清理
- 复制链接
- 全屏图片预览

### 技术细节

#### 代码精简：780 行 → 约 180 行

移除的内容：
- `fearCardRef`、`blindspotCardRef`、`transformCardRef`（3个多余的ref）
- `achievementPath`、`achievementStyle` 状态及其选择器 UI
- `handleDownload`、`handleNativeShare`、`handleLinkSharePrompt`、`handleCloseImagePreview`、`handleRegeneratePreview`、`handleCopyLink`（全部由 ShareDialogBase 接管）
- `FearAwakeningShareCard`、`BlockRevealShareCard`、`TransformationValueShareCard` 的导入和渲染
- `ShareImagePreview` 的直接使用（由 ShareDialogBase 内部管理）
- 手动的滚动锁清理逻辑

保留的内容：
- 用户数据获取逻辑（头像、昵称、合伙人信息、测评数据）
- `onViewComplete` 3秒查看完成回调
- `trigger` 属性（支持自定义触发按钮）
- 所有现有 props 接口（`defaultTab`、`assessmentScore`、`reactionPattern`、`campId` 等）
- 受控/非受控模式兼容

#### 新增 CardTab 类型

```tsx
type CardTab = 'value' | 'camp' | 'achievement';  // 从6种缩减为3种

const CARD_OPTIONS = [
  { id: 'value', label: '测评结果', emoji: '🎁' },
  { id: 'camp',  label: '训练营',   emoji: '🏕️' },
  { id: 'achievement', label: '成就墙', emoji: '🏅' },
];
```

#### 动态 exportCardRef 处理

由于 ShareDialogBase 只接受单个 `exportCardRef`，需要根据 `activeTab` 动态指向对应的卡片 ref：

```tsx
const valueCardRef = useRef<HTMLDivElement>(null);
const campCardRef = useRef<HTMLDivElement>(null);
const achievementCardRef = useRef<HTMLDivElement>(null);

const activeCardRef = activeTab === 'value' ? valueCardRef
  : activeTab === 'camp' ? campCardRef
  : achievementCardRef;
```

#### 调用方兼容性验证

全部 5 个调用方无需任何改动：

| 调用方文件 | defaultTab | 其他 props | 状态 |
|-----------|-----------|-----------|------|
| WealthBlockAssessment.tsx | `"value"` | assessmentScore, reactionPattern | 兼容 |
| WealthBlockResult.tsx | `"value"` | assessmentScore, reactionPattern | 兼容 |
| WealthCampCheckIn.tsx | `"camp"` | campId, currentDay | 兼容 |
| CompactAchievementGrid.tsx | `"achievement"` | open/onOpenChange | 兼容 |
| CampGraduate.tsx | `"achievement"` | campId, currentDay | 兼容 |

### 修改文件

| 文件 | 操作 |
|------|------|
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 主要重写：780行 → 约180行。移除3种卡片、移除选择器、迁移到 ShareDialogBase、使用清晰标签选择器。 |

### 不改动的文件

- 各卡片组件文件（AssessmentValueShareCard、WealthCampShareCard、AchievementShareCard）-- 不变
- FearAwakeningShareCard、BlockRevealShareCard、TransformationValueShareCard 文件 -- 保留在代码库但不再被此对话框导入
- 全部 5 个调用方文件 -- 无需改动，接口完全兼容
- shareCardsRegistry.ts -- 保持审计注册记录

