
## SCL-90 心理测评 - 先测评后支付轻量版路径

### 目标

参照财富卡点测评和情绪健康测评的轻量版实现模式，为 SCL-90 心理测评创建一个独立的"先测评后支付"入口路径 `/scl90-lite`。

---

### 实现内容概览

| 项目 | 说明 |
|------|------|
| 新路由 | `/scl90-lite` |
| 核心特点 | 进入即显示第一道题，跳过介绍页 |
| 题目展示 | 单题模式（非分页 9 题模式），垂直选项按钮 |
| 底部信息 | 仅首题显示，需滚动才能看见 |
| 付费流程 | 测评完成后弹出支付弹窗 |
| 火箭菜单 | 排除该路由 |

---

### 文件修改清单

#### 1. 新建页面: `src/pages/SCL90Lite.tsx`

参照 `WealthAssessmentLite.tsx` 和 `EmotionHealthLite.tsx` 模式创建：

```text
结构:
├── 状态管理: pageState (questions | result)
├── 答案状态: answers, result
├── 购买状态: useSCL90Purchase
├── 支付弹窗: showPayDialog
│
├── 问答组件: SCL90QuestionsLite
│   ├── skipStartScreen={true}
│   └── showFooterInfo={!hasPurchased}
│
├── 结果组件: SCL90Result
│
└── 支付弹窗: SCL90PayDialog
    ├── packageKey="scl90_report"
    └── pendingAnswers, pendingResult
```

#### 2. 新建组件: `src/components/scl90/SCL90QuestionsLite.tsx`

创建全新的轻量版问答组件，采用单题模式而非原版的 9 题分页模式：

| Prop | 类型 | 说明 |
|------|------|------|
| `onComplete` | function | 完成回调 |
| `onExit` | function | 退出回调 |
| `showFooterInfo` | boolean | 是否显示底部信息 |

**关键设计点：**

1. **单题模式**：每次只显示一道题目，答完自动跳转下一题
2. **垂直选项布局**：5 个评分选项（没有/很轻/中等/偏重/严重）垂直排列
3. **固定顶部标题栏**：
   - 标题：SCL-90 心理测评
   - 进度：1/90 格式
   - 进度条
   - 激励文案
   
4. **视觉主题**：采用紫色渐变（SCL-90 专属配色）
   - 背景：`from-purple-50 via-indigo-50/30 to-white`
   - 选中按钮：`from-purple-600 to-indigo-600`

5. **底部信息区域**（仅首题且 `showFooterInfo=true` 时显示）：
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

6. **主容器**：底部内边距适配
```tsx
className="min-h-screen bg-gradient-to-b from-purple-50 via-indigo-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]"
```

#### 3. 修改导出: `src/components/scl90/index.ts`

添加新组件导出：
```tsx
export { SCL90QuestionsLite } from './SCL90QuestionsLite';
```

#### 4. 修改路由: `src/App.tsx`

添加懒加载和路由：
```tsx
// 懒加载
const SCL90Lite = lazy(() => import("./pages/SCL90Lite"));

// 路由定义（在 /scl90 路由附近）
<Route path="/scl90-lite" element={<SCL90Lite />} />
```

#### 5. 修改火箭菜单排除: `src/components/FloatingQuickMenu.tsx`

将 `/scl90-lite` 添加到排除列表：
```tsx
const EXCLUDED_ROUTES = [
  '/auth', '/login', '/register', '/onboarding', 
  '/wealth-block', '/wealth-assessment-lite', 
  '/emotion-health-lite',
  '/scl90-lite',  // 新增
  '/coach-space', '/awakening'
];
```

---

### 页面流程图

```text
用户访问 /scl90-lite
         │
         ▼
  ┌─────────────────┐
  │  第1题问答界面   │ ◄─── 直接显示，无引导页
  │  (顶部: 进度条)  │
  │  (底部: 可滚动   │
  │   查看付费信息)  │
  └────────┬────────┘
           │ 单题模式答题（共90题）
           │ 每答一题自动跳转
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

### 与原版 SCL90Questions 的区别

| 特性 | 原版（分页模式） | 轻量版（单题模式） |
|------|-----------------|-------------------|
| 每页题数 | 9 题 | 1 题 |
| 翻页方式 | 手动点击"下一页" | 答题后自动跳转 |
| 选项布局 | 5列横向网格 | 垂直按钮 |
| 进度保存 | localStorage | 不保存（轻量测评） |
| 退出确认 | 弹窗确认 | 简化或无 |
| 页码指示 | 圆点分页器 | 简单进度文字 |
| 介绍页 | 有 | 跳过 |

---

### 样式主题

采用 SCL-90 的专属紫色配色（与其他测评区分）：

| 元素 | 样式 |
|------|------|
| 背景渐变 | `from-purple-50 via-indigo-50/30 to-white` |
| 选中按钮 | `from-purple-600 to-indigo-600` |
| 进度条 | 紫色主题 |
| 标题徽章 | 紫色系 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/SCL90Lite.tsx` | 新建 | 轻量版页面主入口 |
| `src/components/scl90/SCL90QuestionsLite.tsx` | 新建 | 单题模式问答组件 |
| `src/components/scl90/index.ts` | 修改 | 导出新组件 |
| `src/App.tsx` | 修改 | 添加 /scl90-lite 路由 |
| `src/components/FloatingQuickMenu.tsx` | 修改 | 排除新路由 |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 复用组件 | 复用 `SCL90Result`、`SCL90PayDialog` |
| 购买状态 | 使用现有 `useSCL90Purchase` hook |
| 支付参数 | `packageKey="scl90_report"` |
| 计分函数 | 复用 `calculateSCL90Result` |
| 动画兼容 | 使用 `opacity: 0.01` 和 `translateZ(0)` 确保微信兼容 |
| 自动跳转 | 答题后 300ms 延迟自动跳转下一题 |

