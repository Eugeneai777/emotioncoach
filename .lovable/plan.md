

## 去除"冥想音频库"按钮

### 修改内容

**文件：`src/pages/WealthCampCheckIn.tsx`（第 810-819 行）**

删除冥想音频库入口按钮的整个代码块：

```text
删除内容:
{/* 冥想库入口 */}
<Button
  variant="outline"
  onClick={() => navigate('/meditation-library')}
  className="w-full justify-center gap-2 py-5 text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100"
>
  <span className="text-xl">🧘</span>
  <span className="font-medium">冥想音频库</span>
  <span className="text-xs text-muted-foreground ml-1">随时聆听全部 7 天冥想</span>
</Button>
```

仅删除按钮，不影响 `/meditation-library` 页面本身（路由仍可通过 URL 直接访问）。

