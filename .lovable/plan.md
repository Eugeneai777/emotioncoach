

# 移除测评页面右上角"AI教练"按钮

## 改动

**文件: `src/pages/MidlifeAwakeningPage.tsx`（第 240-250 行）**

将 `rightActions` 中的"AI教练"渐变按钮移除，仅保留分享按钮。同时可以移除不再使用的 `Sparkles` 和 `ChevronRight` 图标导入。

改动前：
```tsx
rightActions={
  <div className="flex items-center gap-1">
    <Button variant="ghost" onClick={() => navigate("/coach-space")} ...>
      <Sparkles />
      <span>AI教练</span>
      <ChevronRight />
    </Button>
    <Button variant="ghost" size="icon" onClick={() => setShareDialogOpen(true)}>
      <Share2 />
    </Button>
  </div>
}
```

改动后：
```tsx
rightActions={
  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShareDialogOpen(true)}>
    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
  </Button>
}
```

仅删除约 6 行代码，清理未使用的导入。
