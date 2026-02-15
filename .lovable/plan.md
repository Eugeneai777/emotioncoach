

## 优化财富简报页面 - 移除重复按钮，保留测评入口

### 修改文件：`src/pages/WealthCampCheckIn.tsx`

Tab 标签和页面标题保持"财富简报"不变，仅清理按钮区域。

### 按钮区域改动（第 836-875 行）

| 按钮 | 处理 |
|------|------|
| 🧘 冥想库 | 移除（今日任务已有入口） |
| 财富测评 | **保留** |
| 教练对话 | 移除（主 Tab 已有入口） |
| 分享邀请 | 移除（页面内已有邀请触发点） |
| 回填记忆 | **保留** |

改动后按钮区域简化为一行两个按钮：

```tsx
<div className="flex items-center justify-between gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => navigate('/wealth-block')}
    className="text-amber-600 border-amber-200 hover:bg-amber-50"
  >
    <Target className="w-4 h-4 mr-1.5" />
    财富测评
  </Button>
  <BackfillMemoriesButton />
</div>
```

### 不改动的部分
- Tab 标签维持"财富简报"
- 空状态文案维持"还没有财富简报"
- 简报卡片列表不变

共删除约 18 行重复按钮代码，其余逻辑不受影响。
