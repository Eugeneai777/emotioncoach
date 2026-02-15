

## 优化"开始对话"固定底部按钮设计

### 当前问题
- 按钮是全宽纯色条，视觉上像一个通知栏而非按钮
- 缺少内容层次（没有副标题或图标装饰）
- 与页面内容的过渡生硬

### 优化方案

**文件：`src/components/coach/CoachEmptyState.tsx`**

重新设计固定底部区域，增加内容层次和视觉吸引力：

1. 容器改为左右留边距（`max-w-md mx-auto`），不再全宽铺满
2. 按钮上方添加一行小字副标题："与财富教练开始一对一对话"
3. 按钮保持圆角胶囊形状，但增加内部图标（MessageCircle）
4. 按钮文案改为"与财富教练开始对话"，更具引导性
5. 背景渐变过渡更柔和，底部容器加圆角卡片效果

### 按钮设计细节

```
容器：固定底部，左右留边距，带微妙圆角和毛玻璃背景
副标题：小号灰色文字 "专属财富教练，为你量身定制"
按钮：
  - 圆角胶囊（rounded-full）
  - amber→orange 渐变
  - 左侧 MessageCircle 图标 + "与财富教练开始对话"
  - 阴影和hover效果
```

### 技术细节

CoachEmptyState.tsx 底部 CTA 区域替换为：

```tsx
<div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
  <div className="max-w-md mx-auto space-y-2">
    <p className="text-center text-sm text-muted-foreground">
      专属财富教练，为你量身定制
    </p>
    <Button
      onClick={() => navigate(chatEntryRoute)}
      className="w-full h-14 rounded-full text-base font-semibold 
        bg-gradient-to-r from-amber-500 to-orange-500 text-white 
        shadow-[0_8px_30px_rgba(245,158,11,0.35)] 
        hover:shadow-[0_8px_40px_rgba(245,158,11,0.5)] 
        active:scale-[0.97] transition-all duration-200 gap-2"
    >
      <MessageCircle className="w-5 h-5" />
      与财富教练开始对话
    </Button>
  </div>
</div>
```

添加 `MessageCircle` 图标的 import（来自 lucide-react）。

背景渐变容器保留 `bg-gradient-to-t from-background via-background/95 to-transparent` 确保内容不被遮挡。

