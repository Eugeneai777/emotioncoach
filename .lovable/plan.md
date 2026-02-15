
## 替换"AI教练"按钮为"财富教练"按钮

### 修改文件
**`src/pages/WealthBlockAssessment.tsx`** 第 685-699 行

### 具体改动
- 去除当前的"AI教练"按钮
- 替换为"财富教练"按钮，保持相同样式，链接指向 `/coach/wealth_coach_4_questions`
- 按钮文字从"AI教练"改为"财富教练"
- 图标和跳转链接保持不变

### 技术细节

将第 685-699 行替换为：
```tsx
{/* 财富教练入口按钮 */}
<Button
  variant="ghost"
  onClick={() => navigate("/coach/wealth_coach_4_questions")}
  className="h-8 sm:h-9 px-3 sm:px-4 rounded-full 
             bg-gradient-to-r from-amber-400 to-orange-400 
             hover:from-amber-500 hover:to-orange-500 
             text-white shadow-md hover:shadow-lg 
             transition-all duration-200 hover:scale-[1.02]
             flex items-center justify-center gap-1.5 sm:gap-2"
>
  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  <span className="text-xs sm:text-sm font-medium">财富教练</span>
  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
</Button>
```

仅改动按钮注释和显示文字，其余样式、图标、跳转路径均不变。
