

## 新建「财富卡点测评-轻量版」独立页面

### 需求确认

根据用户反馈修正：
1. **公司信息**：北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
2. **入口页内容**：使用用户附件中的完整介绍页面设计
3. **付费流程**：复用现有财富卡点测评的 `AssessmentPayDialog` 付费和账号创建流程

---

### 架构设计

```text
新页面路由: /wealth-assessment-lite
          ↓
┌─────────────────────────────────────┐
│  WealthAssessmentLitePage.tsx       │
├─────────────────────────────────────┤
│  pageState: "intro" | "questions"   │
│            | "payment" | "result"   │
├─────────────────────────────────────┤
│  复用组件:                          │
│  - WealthBlockQuestions             │
│  - AssessmentPayDialog              │
│  - WealthBlockResult                │
├─────────────────────────────────────┤
│  新增组件:                          │
│  - LiteIntroCard (入口页)           │
│  - LiteFooter (固定底部页脚)        │
└─────────────────────────────────────┘
```

---

### 页面流程

```text
       ┌──────────────┐
       │    intro     │  ← 入口页（附件设计 + 固定页脚）
       └──────┬───────┘
              │ 点击"开始测评"
              ▼
       ┌──────────────┐
       │  questions   │  ← 测评答题页（复用 WealthBlockQuestions）
       └──────┬───────┘
              │ 完成答题
              ▼
       ┌──────────────┐
       │   payment    │  ← 付费墙（复用 AssessmentPayDialog）
       └──────┬───────┘
              │ 支付成功 + 账号创建
              ▼
       ┌──────────────┐
       │   result     │  ← 查看结果（复用 WealthBlockResult）
       └──────────────┘
```

---

### 新建文件清单

#### 1. 固定底部页脚组件
**文件**：`src/components/wealth-block/LiteFooter.tsx`

```tsx
export function LiteFooter() {
  // 微信公众号跳转链接
  const wechatUrl = "https://mp.weixin.qq.com/..."; // 需要替换为实际链接
  
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t py-3 px-4 safe-area-pb">
      {/* 关注公众号链接 */}
      <a 
        href={wechatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 text-sm text-center block mb-2"
      >
        点此关注公众号
      </a>
      
      {/* 付费提示（红色） */}
      <p className="text-red-500 text-xs text-center mb-1">
        需付费后方可查看结果，结果纯属娱乐仅供参考
      </p>
      
      {/* 公司信息和ICP备案 */}
      <p className="text-muted-foreground text-xs text-center">
        北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
      </p>
    </div>
  );
}
```

#### 2. 入口介绍卡片组件
**文件**：`src/components/wealth-block/LiteIntroCard.tsx`

基于附件图片设计，简洁的介绍页：
- 标题："财富卡点测评"
- 副标题："发现阻碍你赚钱的隐形刹车"
- 简短说明文案
- 底部 CTA 按钮："开始测评"
- 页面需要留出底部页脚空间（pb-32）

#### 3. 主页面组件
**文件**：`src/pages/WealthAssessmentLite.tsx`

```tsx
type PageState = "intro" | "questions" | "payment" | "result";

export default function WealthAssessmentLitePage() {
  const [pageState, setPageState] = useState<PageState>("intro");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: purchaseRecord } = useAssessmentPurchase();
  const hasPurchased = !!purchaseRecord;
  
  // 完成测评回调
  const handleComplete = (result, answers, followUpInsights, deepFollowUpAnswers) => {
    setCurrentResult(result);
    setCurrentAnswers(answers);
    
    if (hasPurchased) {
      setPageState("result");
    } else {
      // 显示付费弹窗
      setShowPayDialog(true);
    }
  };
  
  // 支付成功回调
  const handlePaymentSuccess = (userId: string) => {
    setShowPayDialog(false);
    setPageState("result");
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* 入口页 */}
      {pageState === "intro" && (
        <>
          <LiteIntroCard onStart={() => setPageState("questions")} />
          <LiteFooter />
        </>
      )}
      
      {/* 测评页 */}
      {pageState === "questions" && (
        <WealthBlockQuestions onComplete={handleComplete} />
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <WealthBlockResult result={currentResult} answers={currentAnswers} />
      )}
      
      {/* 付费弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="wealth_block_assessment"
        packageName="财富卡点测评"
      />
    </div>
  );
}
```

---

### 修改文件

#### src/App.tsx
添加新路由：

```tsx
// 懒加载导入
const WealthAssessmentLite = lazy(() => import("./pages/WealthAssessmentLite"));

// 添加路由
<Route path="/wealth-assessment-lite" element={<WealthAssessmentLite />} />
```

---

### 技术规格

| 元素 | 样式 |
|-----|------|
| 关注公众号链接 | `text-blue-500 text-sm text-center` |
| 付费提示 | `text-red-500 text-xs text-center` |
| 公司+ICP备案 | `text-muted-foreground text-xs text-center` |
| 页脚容器 | `fixed bottom-0 inset-x-0 z-50 bg-white border-t py-3 px-4` |
| 主内容区 | `pb-32` (为固定页脚留空间) |

---

### 文件修改总览

| 文件 | 操作 | 说明 |
|-----|------|------|
| `src/components/wealth-block/LiteFooter.tsx` | 新建 | 固定底部页脚 |
| `src/components/wealth-block/LiteIntroCard.tsx` | 新建 | 入口介绍卡片 |
| `src/pages/WealthAssessmentLite.tsx` | 新建 | 轻量版测评主页面 |
| `src/App.tsx` | 修改 | 添加 `/wealth-assessment-lite` 路由 |

---

### 关键复用逻辑

1. **付费流程**：完全复用 `AssessmentPayDialog`，包括：
   - 微信浏览器静默授权
   - 小程序原生支付
   - H5/扫码支付
   - 自动创建账号
   - 购买状态检测

2. **测评题目**：复用 `WealthBlockQuestions`，包括：
   - 30道题目
   - AI深度追问
   - 进度保存

3. **结果展示**：复用 `WealthBlockResult`，包括：
   - 四穷雷达图
   - 维度分析
   - 个性化建议

