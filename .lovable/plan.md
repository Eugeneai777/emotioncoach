
# 分享卡片管理面板设计方案

## 一、全部分享卡片清单

经过深入代码探索，项目共有 **26 张分享卡片**，分为两大类系统：

### 1.1 介绍页分享系统 (18 张) - `IntroShareDialog`

| # | pageKey | 标题 | 类别 | 目标页面 |
|---|---------|------|------|---------|
| 1 | vibrantLife | AI生活教练 | coach | /vibrant-life-intro |
| 2 | parentCoach | 亲子情绪教练 | coach | /parent-coach-intro |
| 3 | parentTeen | 亲子双轨模式 | coach | /parent-teen-intro |
| 4 | wealthCoach | 财富觉醒教练 | coach | /wealth-coach-intro |
| 5 | coachSpace | AI教练空间 | coach | /coach-space-intro |
| 6 | energyStudio | 有劲生活馆 | tool | /energy-studio-intro |
| 7 | awakening | 觉察系统 | tool | /awakening-intro |
| 8 | storyCoach | 故事教练 | coach | /story-coach-intro |
| 9 | communicationCoach | 沟通教练 | coach | /communication-intro |
| 10 | introduction | 有劲AI | tool | /introduction |
| 11 | partnerIntro | 有劲合伙人 | partner | /partner-intro |
| 12 | youjinPartner | 合伙人计划 | partner | /partner/youjin-intro |
| 13 | promoGuide | 推广指南 | partner | /partner/promo-guide |
| 14 | aliveCheck | 安全打卡 | tool | /alive-check-intro |
| 15 | platformIntro | 平台介绍 | tool | /platform-intro |
| 16 | scl90 | SCL-90心理健康自评 | tool | /scl90 |

### 1.2 专属结果分享卡片 (8 张) - 独立组件

| # | 组件名 | 用途 | 位置 |
|---|--------|------|------|
| 1 | SCL90ShareCard | SCL-90测评结果 | src/components/scl90/ |
| 2 | BlockRevealShareCard | 财富盲点揭示 | src/components/wealth-block/ |
| 3 | AchievementShareCard | 成就墙展示 | src/components/wealth-camp/ |
| 4 | GraduationShareCard | 训练营毕业 | src/components/wealth-camp/ |
| 5 | WealthJournalShareCard | 财富日记分享 | src/components/wealth-camp/ |
| 6 | EmotionButtonShareCard | 情绪按钮急救 | src/components/tools/ |
| 7 | AliveCheckShareCard | 安全打卡状态 | src/components/tools/ |
| 8 | ShareCard (Community) | 社区帖子分享 | src/components/community/ |

---

## 二、管理面板设计

### 2.1 页面路由

```
/admin/share-cards  (仅管理员可访问)
```

### 2.2 页面结构

```text
┌─────────────────────────────────────────────────────────────┐
│  📋 分享卡片管理面板                              [返回管理]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 全部(26) │ │ 教练(8)  │ │ 工具(6)  │ │ 合伙人(3)│ ...   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍 搜索卡片...                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌──────────┐ ││
│  │ │   🌟        │ │  │ │   💜        │ │  │ │   💰     │ ││
│  │ │  AI生活教练  │ │  │ │ 亲子情绪教练 │ │  │ │财富觉醒  │ ││
│  │ │             │ │  │ │             │ │  │ │          │ ││
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └──────────┘ ││
│  │ [预览] [测试生成]│  │ [预览] [测试生成]│  │[预览][测试] ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │   ...更多卡片   │  │                 │  │              ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 核心功能

| 功能 | 说明 |
|-----|------|
| **分类筛选** | 按类别 (coach/tool/partner/result) 快速筛选 |
| **搜索** | 按标题或 pageKey 模糊搜索 |
| **缩略预览** | 每张卡片显示 0.3x 缩略图预览 |
| **全屏预览** | 点击预览按钮打开 Dialog 查看原尺寸效果 |
| **模板切换** | IntroShareCard 支持切换 简洁/价值/场景 三种模板 |
| **测试生成** | 一键生成 PNG 图片并下载，验证 html2canvas 效果 |
| **生成状态** | 显示生成耗时、成功/失败状态 |

---

## 三、技术实现

### 3.1 新建文件

| 文件路径 | 说明 |
|---------|------|
| `src/pages/admin/ShareCardsAdmin.tsx` | 管理面板主页面 |
| `src/components/admin/ShareCardPreviewItem.tsx` | 单个卡片预览组件 |
| `src/components/admin/ResultCardPreviewItem.tsx` | 结果类卡片预览组件 |
| `src/config/shareCardsRegistry.ts` | 所有分享卡片注册表 |

### 3.2 卡片注册表设计

```typescript
// src/config/shareCardsRegistry.ts

import { introShareConfigs, IntroShareConfig } from './introShareConfig';

export type ShareCardCategory = 'coach' | 'tool' | 'partner' | 'result';

export interface ShareCardRegistryItem {
  id: string;
  title: string;
  category: ShareCardCategory;
  emoji: string;
  type: 'intro' | 'result';
  // For intro cards
  introConfig?: IntroShareConfig;
  // For result cards
  componentName?: string;
  componentPath?: string;
  mockProps?: Record<string, any>;
}

// 合并 introShareConfigs + 结果卡片为统一注册表
export const shareCardsRegistry: ShareCardRegistryItem[] = [
  // Intro cards from config
  ...Object.values(introShareConfigs).map(config => ({
    id: config.pageKey,
    title: config.title,
    category: config.category,
    emoji: config.emoji,
    type: 'intro' as const,
    introConfig: config,
  })),
  
  // Result cards with mock props
  {
    id: 'scl90-result',
    title: 'SCL-90 测评结果',
    category: 'result',
    emoji: '🧠',
    type: 'result',
    componentName: 'SCL90ShareCard',
    componentPath: 'scl90/SCL90ShareCard',
    mockProps: {
      result: {
        gsi: 1.85,
        severityLevel: 'mild',
        totalScore: 168,
        positiveCount: 42,
        positiveScoreAvg: 2.3,
        primarySymptom: 'anxiety',
        factorScores: { /* mock data */ }
      }
    }
  },
  // ... 其他结果卡片
];
```

### 3.3 预览组件设计

```tsx
// src/components/admin/ShareCardPreviewItem.tsx

interface ShareCardPreviewItemProps {
  item: ShareCardRegistryItem;
  onPreview: () => void;
  onTestGenerate: () => void;
}

export function ShareCardPreviewItem({ item, onPreview, onTestGenerate }) {
  return (
    <Card className="overflow-hidden">
      {/* 缩略图预览区 */}
      <div className="h-[180px] bg-muted/30 overflow-hidden p-2">
        <div className="transform scale-[0.3] origin-top-left">
          {item.type === 'intro' ? (
            <IntroShareCard config={item.introConfig} template="concise" />
          ) : (
            <DynamicResultCard componentName={item.componentName} props={item.mockProps} />
          )}
        </div>
      </div>
      
      {/* 卡片信息 */}
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.emoji}</span>
          <div>
            <p className="font-medium text-sm">{item.title}</p>
            <Badge variant="outline" className="text-xs">{item.category}</Badge>
          </div>
        </div>
      </CardContent>
      
      {/* 操作按钮 */}
      <CardFooter className="p-3 pt-0 gap-2">
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye className="w-3 h-3 mr-1" /> 预览
        </Button>
        <Button size="sm" onClick={onTestGenerate}>
          <Download className="w-3 h-3 mr-1" /> 测试生成
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 3.4 路由配置

```tsx
// 添加到 App.tsx 路由
<Route path="/admin/share-cards" element={<ShareCardsAdmin />} />
```

### 3.5 访问控制

- 仅允许管理员 (admin/super_admin) 访问
- 使用现有的 `useAuth` + `AdminGuard` 逻辑

---

## 四、Mock 数据设计

为结果类卡片提供测试用 Mock 数据：

| 卡片 | Mock 数据内容 |
|-----|-------------|
| SCL90ShareCard | GSI=1.85, 轻度症状, 焦虑为主 |
| BlockRevealShareCard | 心穷, 逃避型, 示例洞察语录 |
| AchievementShareCard | 3个成就已解锁, 进度50% |
| GraduationShareCard | 第7天毕业, 完成5次打卡 |
| EmotionButtonShareCard | 累计使用18次, 最近情绪:焦虑 |
| AliveCheckShareCard | 已打卡30天, 5位联系人 |

---

## 五、文件修改清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/config/shareCardsRegistry.ts` | 新建 | 统一注册表 |
| `src/pages/admin/ShareCardsAdmin.tsx` | 新建 | 管理面板主页 |
| `src/components/admin/ShareCardPreviewItem.tsx` | 新建 | 单卡片预览 |
| `src/components/admin/ResultCardPreviewItem.tsx` | 新建 | 结果卡片预览 |
| `src/components/admin/ShareCardPreviewDialog.tsx` | 新建 | 全屏预览弹窗 |
| `src/App.tsx` | 修改 | 添加路由 |

---

## 六、用户体验亮点

1. **一目了然** - 26张卡片按类别分组，带缩略图预览
2. **快速搜索** - 支持按标题/关键词模糊搜索
3. **模板切换** - IntroShareCard 支持 3 种模板实时预览
4. **生成测试** - 一键验证 html2canvas 输出效果
5. **状态反馈** - 显示生成耗时，便于性能监控

---

## 七、预期效果

| 指标 | 说明 |
|-----|------|
| 覆盖率 | 26/26 卡片全部可预览 |
| 加载时间 | 首屏 <2s (骨架屏优化) |
| 测试效率 | 单卡片生成测试 <3s |
| 可维护性 | 新增卡片只需更新注册表 |
