
## 情绪健康测评 - 先测评后支付路径

### 目标

参照财富卡点测评轻量版（`/wealth-assessment-lite`）的实现模式，为情绪健康测评创建一个独立的"先测评后支付"入口路径 `/emotion-health-lite`。

---

### 实现内容概览

| 项目 | 说明 |
|------|------|
| 新路由 | `/emotion-health-lite` |
| 核心特点 | 进入即显示第一道题，跳过介绍页 |
| 底部信息 | 仅首屏显示，需滚动才能看见 |
| 付费流程 | 测评完成后弹出支付弹窗 |
| 火箭菜单 | 排除该路由 |

---

### 文件修改清单

#### 1. 新建页面: `src/pages/EmotionHealthLite.tsx`

参照 `WealthAssessmentLite.tsx` 模式创建：

```text
结构:
├── 状态管理: pageState (questions | result)
├── 答案状态: answers, result
├── 购买状态: useEmotionHealthPurchase
├── 支付弹窗: showPayDialog
│
├── 问答组件: EmotionHealthQuestionsLite
│   ├── skipStartScreen={true}
│   └── showFooterInfo={!hasPurchased}
│
├── 结果组件: EmotionHealthResult
│
└── 支付弹窗: AssessmentPayDialog
    ├── packageKey="emotion_health_assessment"
    └── packageName="情绪健康测评"
```

#### 2. 新建/修改组件: `src/components/emotion-health/EmotionHealthQuestionsLite.tsx`

基于现有 `EmotionHealthQuestions.tsx`，添加两个新 props：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `skipStartScreen` | boolean | false | 是否跳过引导页 |
| `showFooterInfo` | boolean | false | 是否显示底部信息 |

**关键修改点：**

1. **布局调整**：采用类似财富测评的单题布局
   - 固定顶部标题栏（标题 + 进度）
   - 渐变背景
   - 垂直选项按钮（非 2x2 网格）
   
2. **底部信息区域**（仅在首题且 `showFooterInfo=true` 时显示）：
```tsx
{showFooterInfo && currentIndex === 0 && (
  <div className="mt-16 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
    <a href="/wechat-auth?mode=follow" className="text-muted-foreground text-sm block">
      点此关注公众号
    </a>
    <p className="text-muted-foreground text-xs">
      需付费后方可查看结果，结果纯属娱乐仅供参考
    </p>
    <p className="text-muted-foreground text-xs">
      北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
    </p>
  </div>
)}
```

3. **主容器**：添加底部内边距适配
```tsx
className="min-h-screen bg-gradient-to-b from-rose-50 via-purple-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]"
```

#### 3. 修改路由: `src/App.tsx`

添加新路由：
```tsx
// 懒加载
const EmotionHealthLite = lazy(() => import("./pages/EmotionHealthLite"));

// 路由定义
<Route path="/emotion-health-lite" element={<EmotionHealthLite />} />
```

#### 4. 修改火箭菜单排除: `src/components/FloatingQuickMenu.tsx`

将 `/emotion-health-lite` 添加到排除列表：
```tsx
const EXCLUDED_ROUTES = [
  '/auth', '/login', '/register', '/onboarding', 
  '/wealth-block', '/wealth-assessment-lite', 
  '/emotion-health-lite',  // 新增
  '/coach-space', '/awakening'
];
```

---

### 页面流程图

```text
用户访问 /emotion-health-lite
         │
         ▼
  ┌─────────────────┐
  │  第1题问答界面   │ ◄─── 直接显示，无引导页
  │  (顶部: 进度条)  │
  │  (底部: 可滚动   │
  │   查看付费信息)  │
  └────────┬────────┘
           │ 答题中...
           ▼
  ┌─────────────────┐
  │   完成所有题目   │
  └────────┬────────┘
           │
     ┌─────┴─────┐
     │           │
  已购买?     未购买?
     │           │
     ▼           ▼
 直接显示    弹出支付弹窗
  结果页    ───────────┐
     ▲                 │
     │     支付成功后   │
     └─────────────────┘
```

---

### 样式主题

采用情绪健康测评的专属配色（紫玫红渐变），与财富测评（琥珀橙渐变）区分：

| 元素 | 样式 |
|------|------|
| 背景渐变 | `from-rose-50 via-purple-50/30 to-white` |
| 选中按钮 | `from-rose-500 to-purple-500` |
| 进度条 | 紫色主题 |
| 标题徽章 | 紫色/玫红 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/EmotionHealthLite.tsx` | 新建 | 轻量版页面主入口 |
| `src/components/emotion-health/EmotionHealthQuestionsLite.tsx` | 新建 | 支持 skipStartScreen 和 showFooterInfo 的问答组件 |
| `src/components/emotion-health/index.ts` | 修改 | 导出新组件 |
| `src/App.tsx` | 修改 | 添加 /emotion-health-lite 路由 |
| `src/components/FloatingQuickMenu.tsx` | 修改 | 排除新路由 |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 复用组件 | 复用 `EmotionHealthResult`、`AssessmentPayDialog` |
| 购买状态 | 使用现有 `useEmotionHealthPurchase` hook |
| 支付参数 | `packageKey="emotion_health_assessment"` |
| 层级过渡 | 保留原有的层间过渡卡片逻辑 |
| 动画兼容 | 使用 `opacity: 0.01` 和 `translateZ(0)` 确保微信兼容 |
