

## 情绪🆘按钮 收费模式改造方案

### 目标

将情绪按钮转变为 ¥9.9 付费模式，参照其他产品（死了吗、觉察日记）的轻量版入口模式实现。

---

### 整体架构

| 项目 | 说明 |
|------|------|
| 新入口路由 | `/emotion-button-lite` |
| 付费包Key | `emotion_button` |
| 收费 | ¥9.9 |
| 介绍页入口 | `/emotion-button-intro` 底部添加轻模式链接 |

---

### 数据库变更

在 `packages` 表中新增产品包：

```sql
INSERT INTO packages (package_key, package_name, price, description, product_line, is_active, display_order)
VALUES ('emotion_button', '情绪SOS按钮', 9.90, '9种情绪场景 + 4阶段科学设计 + 288条认知提醒', 'youjin', true, 10);
```

---

### 文件修改清单

#### 1. 新建：轻量版入口页面

**`src/pages/EmotionButtonLite.tsx`**

参照 `AliveCheckLite.tsx` 模式创建：

| 组成部分 | 说明 |
|---------|------|
| 顶部导航 | 返回按钮 + 标题 + 介绍页入口 |
| 主内容 | 直接显示 9 个情绪按钮网格 |
| 购买状态 | 使用 `usePackagePurchased('emotion_button')` |
| 支付逻辑 | 用户选择情绪后，若未购买则弹出 `AssessmentPayDialog` |
| 底部提示 | 未登录用户显示"先体验后付费 ¥9.9"及备案信息 |
| 视觉主题 | 沿用原有青色渐变（`from-teal-50 via-cyan-50 to-blue-50`）|

**核心流程：**
```text
用户访问 /emotion-button-lite
         │
         ▼
  ┌─────────────────┐
  │  9按钮情绪选择   │ ◄─── 直接显示
  │  (底部：轻模式   │
  │   付费提示)      │
  └────────┬────────┘
           │ 用户点击任一情绪按钮
           │
     ┌─────┴─────┐
     │           │
  已购买?     未购买?
     │           │
     ▼           ▼
 进入完整    弹出支付弹窗
 疗愈流程    ───────────┐
                        │
              支付成功后 │
     ┌──────────────────┘
     ▼
   进入疗愈流程
```

#### 2. 修改：介绍页添加轻模式入口

**`src/pages/EmotionButtonIntro.tsx`**

在固定底部CTA区域添加轻模式入口链接：

```tsx
// 底部CTA区域修改
<div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-teal-100 p-4 z-20">
  <div className="container max-w-4xl mx-auto space-y-2">
    <Button ...>
      立即体验情绪急救 🆘
    </Button>
    
    {/* 新增：轻模式入口（未登录/未购买用户可见） */}
    {!user && (
      <a 
        href="/emotion-button-lite" 
        className="text-muted-foreground text-sm block text-center hover:text-primary transition-colors"
      >
        💡 先体验后付费 ¥9.9
      </a>
    )}
  </div>
</div>
```

需要在组件中：
- 导入 `useAuth` hook
- 导入 `usePackagePurchased` hook
- 添加条件渲染逻辑

#### 3. 修改：路由注册

**`src/App.tsx`**

```tsx
// 新增懒加载
const EmotionButtonLite = lazy(() => import("./pages/EmotionButtonLite"));

// 新增路由（在 emotion-button 路由附近）
<Route path="/emotion-button-lite" element={<EmotionButtonLite />} />
```

#### 4. 修改：浮动菜单排除

**`src/components/FloatingQuickMenu.tsx`**

将 `/emotion-button-lite` 添加到排除列表：

```tsx
const EXCLUDED_ROUTES = [
  // ... 现有路由
  '/emotion-button-lite',  // 新增
];
```

---

### 与现有免费试用系统的关系

| 现有实现 | 改造后 |
|---------|--------|
| `useFreeTrialTracking` 追踪使用次数 | 保留，用于未购买用户的体验限制追踪 |
| `EmotionButtonPurchaseDialog` 弹窗 | 在轻入口用 `AssessmentPayDialog` 替代 |
| 5 次免费使用后弹窗 | 轻入口首次使用即弹窗（未购买时） |

**注意：** 原有 `/` 页面的情绪按钮入口（从情绪教练推荐跳转）保持现有逻辑不变，轻入口是独立的付费转化路径。

---

### 样式主题

| 元素 | 样式 |
|------|------|
| 背景渐变 | `from-teal-50 via-cyan-50 to-blue-50`（沿用原有） |
| 导航按钮 | `text-teal-700`、`bg-white/60` |
| 标题 | `情绪🆘按钮`、`text-teal-800` |
| 9 按钮 | 沿用 `emotionTypes` 配置的渐变色 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/EmotionButtonLite.tsx` | 新建 | 轻量版页面主入口 |
| `src/pages/EmotionButtonIntro.tsx` | 修改 | 底部添加轻模式入口链接 |
| `src/App.tsx` | 修改 | 添加 /emotion-button-lite 路由 |
| `src/components/FloatingQuickMenu.tsx` | 修改 | 排除新路由 |
| 数据库迁移 | 新建 | 添加 emotion_button 产品包 |

---

### 外部链接

改造完成后的轻入口链接：

```
https://wechat.eugenewe.net/emotion-button-lite
```

介绍页链接（带轻模式入口）：

```
https://wechat.eugenewe.net/emotion-button-intro
```

---

### 验收标准

1. ✅ `/emotion-button-lite` 入口直接显示 9 个情绪按钮
2. ✅ 未购买用户点击情绪按钮后弹出 ¥9.9 支付弹窗
3. ✅ 已购买用户可直接进入疗愈流程
4. ✅ 介绍页底部显示轻模式入口（未登录/未购买用户可见）
5. ✅ 登录且已购买用户自动隐藏轻模式提示
6. ✅ 支付成功后可正常使用全部功能

