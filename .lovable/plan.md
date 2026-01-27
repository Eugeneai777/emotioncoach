
# 情绪健康测评支付门槛与历史记录实现计划

## 问题分析

当前情绪健康测评存在三个核心问题：

1. **无支付门槛** - 用户无需付费即可开始测评
2. **无历史记录** - 完成后无法再次查看报告
3. **硬编码状态** - `is_paid` 被硬编码为 `true`

## 目标

使情绪健康测评与财富卡点测评保持一致的用户体验：
- 需要支付 ¥9.90 才能开始测评
- 支持微信静默授权 + JSAPI支付
- 已购买用户自动跳过介绍页
- 完成后可查看历史测评记录

## 实现方案

### 第一步：创建购买状态检查 Hook

创建 `useEmotionHealthPurchase.ts`，复用财富测评的查询模式：

```text
src/hooks/useEmotionHealthPurchase.ts
- 查询 orders 表，检查 package_key = 'emotion_health_assessment'
- 返回购买记录和加载状态
```

### 第二步：重构页面状态机

将页面状态从 `start | questions | result` 扩展为：

```text
'intro' | 'questions' | 'result' | 'history'

状态流转：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  未购买用户:  intro ──(支付)──> questions ──> result        │
│                                                             │
│  已购买用户:  intro(自动跳过) ──> questions ──> result      │
│               ↓                                              │
│            history ←────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 第三步：集成支付弹窗

在 `EmotionHealthPage.tsx` 中集成 `AssessmentPayDialog`：

```text
新增状态:
- showPayDialog: boolean
- isRedirectingForAuth: boolean

新增逻辑:
- handlePayClick(): 微信环境触发静默授权，其他直接打开弹窗
- triggerWeChatSilentAuth(): 调用 wechat-pay-auth 函数
- usePaymentCallback(): 监听支付回调

修改 handleStart():
- 未登录 → 跳转登录
- 未购买 → 打开支付弹窗
- 已购买 → 进入测评
```

### 第四步：修改开始页组件

更新 `EmotionHealthStartScreen.tsx`：

```text
新增 props:
- hasPurchased: boolean
- onPayClick: () => void
- isLoading: boolean

按钮逻辑:
- 未购买: 显示 "¥9.90 开始测评" 并调用 onPayClick
- 已购买: 显示 "开始测评" 并调用 onStart
```

### 第五步：修复数据保存逻辑

更新 `handleComplete` 函数：

```text
修改前:
  is_paid: true  // 硬编码

修改后:
  order_id: purchaseRecord?.orderId  // 关联订单
  is_paid: true
  paid_at: purchaseRecord?.paidAt
```

### 第六步：添加历史记录功能

创建历史记录组件和查询：

```text
src/components/emotion-health/EmotionHealthHistory.tsx
- 列表展示历史测评
- 点击可查看详细报告
- 支持删除（可选）

src/hooks/useEmotionHealthHistory.ts
- 查询 emotion_health_assessments 表
- 按 created_at 降序排列
```

### 第七步：更新页面布局

添加 Tab 切换支持历史查看：

```text
<Tabs value={activeTab}>
  <TabsList>
    <TabsTrigger value="assessment">测评</TabsTrigger>
    <TabsTrigger value="history">历史记录</TabsTrigger>
  </TabsList>
  
  <TabsContent value="assessment">
    {/* 现有测评流程 */}
  </TabsContent>
  
  <TabsContent value="history">
    <EmotionHealthHistory />
  </TabsContent>
</Tabs>
```

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useEmotionHealthPurchase.ts` | 新建 | 购买状态检查 Hook |
| `src/hooks/useEmotionHealthHistory.ts` | 新建 | 历史记录查询 Hook |
| `src/components/emotion-health/EmotionHealthHistory.tsx` | 新建 | 历史记录列表组件 |
| `src/pages/EmotionHealthPage.tsx` | 修改 | 集成支付、历史、状态管理 |
| `src/components/emotion-health/EmotionHealthStartScreen.tsx` | 修改 | 添加价格显示和支付入口 |
| `src/components/emotion-health/index.ts` | 修改 | 导出新组件 |

---

## 技术细节

### 微信支付流程

```text
用户点击"开始测评"
      │
      ▼
  检查是否登录? ──否──> 跳转 /auth
      │是
      ▼
  检查是否已购买? ──是──> 直接开始测评
      │否
      ▼
  是否微信环境? ──否──> 打开支付弹窗 (扫码)
      │是
      ▼
  是否有 OpenID? ──是──> 打开支付弹窗 (JSAPI)
      │否
      ▼
  触发静默授权 → 回调页面 → 重新打开弹窗
```

### 数据库关联

```text
orders 表
├── package_key: 'emotion_health_assessment'
├── status: 'paid'
└── user_id: uuid

emotion_health_assessments 表
├── order_id: FK → orders.id
├── is_paid: boolean
└── paid_at: timestamp
```

### 复用组件

直接复用以下现有组件，无需修改：
- `AssessmentPayDialog` - 支付弹窗
- `usePaymentCallback` - 支付回调处理
- `QuickRegisterStep` - 游客注册流程
