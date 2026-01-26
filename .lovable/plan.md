
# 情绪健康测评分享卡片实施方案

## 一、需求分析

为情绪健康测评添加两类分享功能：
1. **开始页分享** - 邀请好友来测评（复用 IntroShareDialog）
2. **结果页分享** - 分享测评结果（新建专属分享卡片）

## 二、实施方案

### 2.1 开始页分享入口

**文件**: `src/config/introShareConfig.ts`

在 `introShareConfigs` 中添加情绪健康测评配置：

```typescript
emotionHealth: {
  pageKey: 'emotionHealth',
  title: '情绪健康测评',
  subtitle: '32题三层诊断，找到你的情绪卡点',
  targetUrl: '/emotion-health',
  emoji: '❤️‍🩹',
  highlights: [
    '三层诊断·状态/模式/阻滞点',
    '对标PHQ-9/GAD-7/PSS-10权威量表',
    'AI教练个性化陪伴修复',
  ],
  gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  category: 'tool'
},
```

**文件**: `src/components/emotion-health/EmotionHealthStartScreen.tsx`

在标题区域添加分享按钮：

```tsx
import { Share2 } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

// 在 Hero 区域右上角添加分享按钮
<IntroShareDialog 
  config={introShareConfigs.emotionHealth}
  trigger={
    <Button variant="ghost" size="icon" className="text-white/80 hover:text-white">
      <Share2 className="w-5 h-5" />
    </Button>
  }
/>
```

### 2.2 结果页分享卡片

**新建文件**: `src/components/emotion-health/EmotionHealthShareCard.tsx`

分享卡片设计：
- 宽度：340px（标准尺寸）
- 主题：紫粉渐变（from-violet-900 via-purple-900 to-rose-900）
- 内容模块：
  1. 头部：标题 + 日期 + 用户头像
  2. 整体状态：三维指数仪表盘（能量/焦虑/压力）
  3. 主要模式：emoji + 模式名 + 一句话洞察
  4. 阻滞点：简要描述
  5. 底部：二维码 + 品牌标识

```tsx
export const EmotionHealthShareCard = React.forwardRef<HTMLDivElement, Props>(
  ({ result, userName, avatarUrl }, ref) => {
    // 卡片渲染逻辑
    return (
      <div ref={ref} className="w-[340px] bg-gradient-to-br from-violet-900 via-purple-900 to-rose-900 text-white p-5 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-300" />
            <div>
              <p className="text-xs text-pink-200">情绪健康测评</p>
              <p className="text-sm font-semibold">{dateStr}</p>
            </div>
          </div>
          {avatarUrl && <img src={avatarUrl} className="w-10 h-10 rounded-full" />}
        </div>

        {/* 三维指数 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <IndexCard label="能量" value={result.energyIndex} />
          <IndexCard label="焦虑" value={result.anxietyIndex} />
          <IndexCard label="压力" value={result.stressIndex} />
        </div>

        {/* 主要模式 */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-white/60 mb-2">我的情绪反应模式</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{patternConfig[result.primaryPattern].emoji}</span>
            <div>
              <p className="font-bold">{patternConfig[result.primaryPattern].name}</p>
              <p className="text-xs text-white/70">{patternConfig[result.primaryPattern].tagline}</p>
            </div>
          </div>
        </div>

        {/* 阻滞点 */}
        <div className="bg-rose-500/20 rounded-lg p-2.5 mb-4">
          <p className="text-xs text-rose-200">
            🎯 行动阻滞点：{blockedDimensionConfig[result.blockedDimension].blockPointName}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-xs text-white/60">扫码测测你的情绪健康状态</p>
            <p className="text-sm font-medium text-pink-300">32题找到情绪卡点</p>
            <p className="text-xs text-white/40 mt-1">Powered by 有劲AI</p>
          </div>
          {qrCodeUrl && <img src={qrCodeUrl} className="w-16 h-16 rounded-lg" />}
        </div>
      </div>
    );
  }
);
```

**新建文件**: `src/components/emotion-health/EmotionHealthShareDialog.tsx`

复用 SCL-90 的 Dialog 模式：
- 预览卡片（0.85x 缩放）
- 隐藏的全尺寸导出卡片
- 生成按钮（紫粉渐变）
- 全屏图片预览

### 2.3 主页面集成

**文件**: `src/pages/EmotionHealthPage.tsx`

添加分享状态和处理函数：

```tsx
const [shareDialogOpen, setShareDialogOpen] = useState(false);

const handleShare = () => {
  setShareDialogOpen(true);
};

// 在 EmotionHealthResult 组件传入 onShare
<EmotionHealthResult
  result={result}
  onShare={handleShare}
  onRetake={handleRetake}
/>

// 添加分享 Dialog
{result && (
  <EmotionHealthShareDialog
    open={shareDialogOpen}
    onOpenChange={setShareDialogOpen}
    result={result}
  />
)}
```

### 2.4 注册表更新

**文件**: `src/config/shareCardsRegistry.ts`

在 `resultCards` 数组添加：

```typescript
{
  id: 'emotion-health-result',
  title: '情绪健康测评结果',
  category: 'result',
  emoji: '❤️‍🩹',
  type: 'result',
  componentName: 'EmotionHealthShareCard',
  description: '三层诊断情绪卡点分享',
},
```

### 2.5 导出更新

**文件**: `src/components/emotion-health/index.ts`

添加新组件导出：

```typescript
export { EmotionHealthShareCard } from './EmotionHealthShareCard';
export { EmotionHealthShareDialog } from './EmotionHealthShareDialog';
```

## 三、文件修改清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/config/introShareConfig.ts` | 修改 | 添加 emotionHealth 配置 |
| `src/components/emotion-health/EmotionHealthStartScreen.tsx` | 修改 | 添加分享按钮 |
| `src/components/emotion-health/EmotionHealthShareCard.tsx` | 新建 | 结果分享卡片组件 |
| `src/components/emotion-health/EmotionHealthShareDialog.tsx` | 新建 | 结果分享 Dialog |
| `src/pages/EmotionHealthPage.tsx` | 修改 | 集成分享功能 |
| `src/config/shareCardsRegistry.ts` | 修改 | 注册新卡片 |
| `src/components/emotion-health/index.ts` | 修改 | 导出新组件 |

## 四、分享卡片视觉效果

### 开始页分享卡片（IntroShareCard）
- **标题**: 情绪健康测评
- **副标题**: 32题三层诊断，找到你的情绪卡点
- **核心卖点**:
  - 三层诊断·状态/模式/阻滞点
  - 对标PHQ-9/GAD-7/PSS-10权威量表
  - AI教练个性化陪伴修复
- **主题色**: 紫粉渐变

### 结果页分享卡片（EmotionHealthShareCard）
- **三维指数仪表盘**: 能量/焦虑/压力 0-100
- **主要模式**: 🔋能量耗竭型 / 🎯高度紧绷型 / 🤐情绪压抑型 / 🐢逃避延迟型
- **阻滞点**: 行动/情绪/信念/给予
- **品牌标识**: Powered by 有劲AI

## 五、技术要点

1. **复用现有系统**: 开始页使用 IntroShareDialog，结果页参考 SCL90ShareDialog
2. **合伙人追踪**: 二维码自动带上用户的 ref 参数
3. **性能优化**: 使用优化后的 shareCardConfig.ts 配置
4. **深色模式**: 卡片背景固定深色，无需适配
5. **微信兼容**: 使用标准的分享流程和图片预览

## 六、预期效果

| 指标 | 说明 |
|-----|------|
| 开始页入口 | 右上角分享按钮，紫粉渐变主题 |
| 结果页入口 | 底部"分享结果"按钮 |
| 卡片尺寸 | 340x~480px 标准尺寸 |
| 生成时间 | <3s（优化后） |
| 兼容性 | 微信/iOS/Android 全平台 |
