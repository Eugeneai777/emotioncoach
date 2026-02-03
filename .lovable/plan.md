

## 移除入口介绍页 - 直接开始答题

### 需求理解

用户希望访问 `/wealth-assessment-lite` 时：
- **移除**：LiteIntroCard 入口介绍页
- **直接显示**：WealthBlockQuestions 答题页面
- **保留**：底部页脚内容（公众号链接、付费提示、ICP备案）在答题页显示

---

### 修改方案

#### 文件: `src/pages/WealthAssessmentLite.tsx`

| 修改项 | 内容 |
|--------|------|
| 修改 | 初始状态从 `"intro"` 改为 `"questions"` |
| 移除 | `pageState === "intro"` 条件分支 |
| 可选 | 在答题页显示底部页脚 |

```tsx
// 修改前
const [pageState, setPageState] = useState<PageState>("intro");

// 修改后  
const [pageState, setPageState] = useState<PageState>("questions");
```

---

### 页面流程变更

```text
修改前:
intro(入口页) → questions(答题) → payment(付费) → result(结果)

修改后:
questions(答题) → payment(付费) → result(结果)
```

---

### 底部页脚处理

两种方案供选择：

| 方案 | 描述 |
|------|------|
| A. 移除页脚 | 答题页不显示底部页脚，仅在付费/结果页显示 |
| B. 保留页脚 | 在答题页底部也显示公众号链接和ICP备案信息 |

建议采用 **方案 A**（移除页脚），因为答题页面已有自己的底部导航和进度条，增加页脚会造成界面拥挤。

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/WealthAssessmentLite.tsx` | 修改 | 初始状态改为 "questions"，移除 intro 分支 |
| `src/components/wealth-block/LiteIntroCard.tsx` | 可删除 | 不再使用（可保留以备将来） |
| `src/components/wealth-block/LiteFooter.tsx` | 保留 | 在结果页可能仍需使用 |

---

### 代码修改示例

```tsx
// src/pages/WealthAssessmentLite.tsx

type PageState = "questions" | "result";  // 移除 "intro"

export default function WealthAssessmentLitePage() {
  const [pageState, setPageState] = useState<PageState>("questions");  // 直接从答题开始
  
  // ... 其他状态保持不变
  
  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background">
      {/* 直接显示测评页 */}
      {pageState === "questions" && (
        <WealthBlockQuestions 
          onComplete={handleComplete} 
          onExit={handleExit}
        />
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <WealthBlockResult 
          result={currentResult} 
          followUpInsights={followUpInsights}
          deepFollowUpAnswers={deepFollowUpAnswers}
          onRetake={handleRetake}
        />
      )}
      
      {/* 付费弹窗 */}
      <AssessmentPayDialog ... />
    </div>
  );
}
```

