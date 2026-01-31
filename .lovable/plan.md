
# 为情绪健康测评页面添加与财富卡点相同的头部按钮

## 需求分析

根据截图和代码对比，财富卡点测评页面(`/wealth-block`)的 PageHeader 右侧有两个按钮：
1. **"AI教练" 按钮** - 橙色渐变按钮，带闪光图标和箭头，点击跳转到 `/coach-space`
2. **分享按钮** - 图标按钮，点击打开分享弹窗

而情绪健康测评页面(`/emotion-health`)目前只有基础的返回按钮和标题，缺少这两个功能入口。

---

## 修改方案

### 修改文件：`src/pages/EmotionHealthPage.tsx`

#### 1. 添加所需的 import

```typescript
import { Share2, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
```

#### 2. 更新 PageHeader 组件

将当前的简单 PageHeader：

```tsx
<PageHeader 
  title={step === 'result' ? "测评结果" : "情绪健康测评"} 
  showBack={step !== 'start' || activeTab !== 'assessment'}
/>
```

改为带有右侧操作按钮的版本：

```tsx
<PageHeader 
  title={step === 'result' ? "测评结果" : "情绪健康测评"} 
  showBack={step !== 'start' || activeTab !== 'assessment'}
  className="bg-gradient-to-r from-violet-50/95 via-pink-50/95 to-violet-50/95 border-b border-violet-200/50"
  rightActions={
    <div className="flex items-center gap-1">
      {/* AI教练专区入口按钮 */}
      <Button
        variant="ghost"
        onClick={() => navigate("/coach-space")}
        className="h-8 sm:h-9 px-3 sm:px-4 rounded-full 
                   bg-gradient-to-r from-amber-400 to-orange-400 
                   hover:from-amber-500 hover:to-orange-500 
                   text-white shadow-md hover:shadow-lg 
                   transition-all duration-200 hover:scale-[1.02]
                   flex items-center justify-center gap-1.5 sm:gap-2"
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-medium">AI教练</span>
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>
      
      {/* 分享按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
        onClick={() => setShareDialogOpen(true)}
      >
        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  }
/>
```

---

## 技术细节

| 元素 | 样式 | 功能 |
|-----|------|------|
| AI教练按钮 | `bg-gradient-to-r from-amber-400 to-orange-400`，圆角胶囊形 | 跳转到 `/coach-space` |
| 分享按钮 | ghost 风格图标按钮 | 打开 `EmotionHealthShareDialog` 分享弹窗 |
| PageHeader 背景 | 紫粉渐变以匹配情绪健康的品牌色调 | 视觉统一 |

## 条件显示逻辑

分享按钮应该只在有测评结果时显示（即 `result` 不为空），或者可以始终显示分享页面入口。根据财富卡点的实现，分享按钮是始终可见的。

---

## 影响范围

- 仅修改 1 个文件：`src/pages/EmotionHealthPage.tsx`
- 不影响其他页面的现有功能
- 复用已有的 `EmotionHealthShareDialog` 组件
