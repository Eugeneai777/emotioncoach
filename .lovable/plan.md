

## 优化"开始对话"按钮 - 更大更醒目

### 问题
冥想完成后，教练对话区域的"开始对话"按钮（第 196-206 行）使用了 `size="sm"` + `variant="outline"`，太小且不显眼，用户容易忽略。

### 方案
将当前的小按钮替换为一个更具引导性的 CTA 区域，包含：
1. 一个引导性图标（如 MessageSquare）和简短说明文字
2. 一个大尺寸、渐变色的主按钮，与财富教练的琥珀色主题一致
3. 添加微妙的脉冲动画吸引注意力

### 技术细节

**文件：`src/components/wealth-camp/WealthCoachEmbedded.tsx`**

将第 193-207 行的空状态区域替换为：

```tsx
) : messages.length === 0 && !isLoading ? (
  <div className="flex flex-col items-center justify-center py-16 space-y-6">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
      <MessageSquare className="w-8 h-8 text-amber-600 dark:text-amber-400" />
    </div>
    <div className="text-center space-y-2">
      <p className="text-base font-medium text-foreground">准备好梳理今天的冥想体验了吗？</p>
      <p className="text-sm text-muted-foreground">教练将引导你回顾和反思</p>
    </div>
    <Button
      size="lg"
      onClick={...}
      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 text-base px-8 animate-pulse"
    >
      <MessageSquare className="w-5 h-5" />
      开始教练梳理
    </Button>
  </div>
)
```

- 需要在顶部 import 中加入 `MessageSquare`（来自 lucide-react）
- 按钮尺寸从 `sm` 提升到 `lg`，并使用琥珀色渐变背景
- 添加圆形图标容器和引导文案，让用户明确理解下一步操作
- 使用 `animate-pulse` 轻微脉冲吸引注意（2-3 秒后自然感知）
