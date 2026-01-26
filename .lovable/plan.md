
# SCL-90 开始页分享入口实施方案

## 一、需求分析

在 SCL-90 开始页添加分享入口，让用户可以邀请好友来测评。这需要：
1. 在 `introShareConfig.ts` 中添加 SCL-90 的分享配置
2. 在 `SCL90StartScreen.tsx` 中集成 `IntroShareDialog` 组件

## 二、实施方案

### 2.1 添加 SCL-90 分享配置

**文件**: `src/config/introShareConfig.ts`

在 `introShareConfigs` 对象中添加 SCL-90 配置：

```typescript
scl90: {
  pageKey: 'scl90',
  title: 'SCL-90 心理健康自评',
  subtitle: '专业测评，清楚了解自己的情绪状态',
  targetUrl: '/scl90',
  emoji: '🧠',
  highlights: [
    '90题专业量表·10大心理因子',
    '全球权威抑郁焦虑自测工具',
    'AI个性化解读与建议',
  ],
  gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',  // 紫色渐变，与页面主题一致
  category: 'tool'
},
```

### 2.2 在开始页添加分享按钮

**文件**: `src/components/scl90/SCL90StartScreen.tsx`

**修改点1**: 添加必要的 import

```typescript
import { Share2 } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
```

**修改点2**: 在标题区域右侧添加分享按钮

在标题区域（第79-89行附近），将现有的居中布局改为 flex 布局，在右侧添加分享入口：

```tsx
{/* 标题区域 - 带分享按钮 */}
<div className="flex items-start justify-between">
  <div className="flex-1" /> {/* 左侧占位 */}
  
  <div className="text-center space-y-2 flex-1">
    <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-medium">
      <Brain className="w-4 h-4" />
      <span>SCL-90 心理健康自评</span>
    </div>
    <h2 className="text-lg font-bold">怎么判断是焦虑还是心情烦？</h2>
    <p className="text-sm text-muted-foreground">
      专业自测，清楚了解自己的情绪状态
    </p>
  </div>
  
  {/* 分享按钮 */}
  <div className="flex-1 flex justify-end">
    <IntroShareDialog 
      config={introShareConfigs.scl90}
      trigger={
        <Button variant="ghost" size="icon" className="text-purple-600">
          <Share2 className="w-5 h-5" />
        </Button>
      }
    />
  </div>
</div>
```

## 三、文件修改清单

| 文件路径 | 修改类型 | 修改内容 |
|---------|---------|---------|
| `src/config/introShareConfig.ts` | 新增配置 | 添加 `scl90` 分享配置对象 |
| `src/components/scl90/SCL90StartScreen.tsx` | 集成组件 | 导入并添加 `IntroShareDialog` |

## 四、分享卡片效果预览

分享卡片将包含以下元素：
- **标题**: SCL-90 心理健康自评
- **副标题**: 专业测评，清楚了解自己的情绪状态
- **核心卖点**:
  - 90题专业量表·10大心理因子
  - 全球权威抑郁焦虑自测工具
  - AI个性化解读与建议
- **二维码**: 指向 `/scl90` 页面
- **品牌标识**: Powered by 有劲AI
- **三种模板可选**: 简洁版 / 价值版 / 场景版

## 五、技术要点

1. **复用现有系统**: 使用项目已有的 `IntroShareDialog` 组件，无需额外开发
2. **合伙人追踪**: 分享链接自动带上用户的 `ref` 参数，支持推广归因
3. **多平台适配**: 自动检测微信/iOS/Android 环境，使用最佳分享方式
4. **深色模式**: 分享按钮颜色自动适配主题
