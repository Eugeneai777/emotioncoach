
## 「死了吗」和「觉察日记」收费模式实现方案

### 目标

将"死了吗"安全打卡和"觉察日记"两个功能转变为付费模式，收费 ¥9.9。参照现有测评类产品（财富卡点、情绪健康、SCL-90）的"先体验后支付"轻量版模式实现。

---

### 整体架构

| 功能 | 新入口路由 | 付费包Key | 收费 |
|------|-----------|----------|------|
| 死了吗 | `/alive-check-lite` | `alive_check` | ¥9.9 |
| 觉察日记 | `/awakening-lite` | `awakening_system` | ¥9.9 |

---

### 数据库变更

在 `packages` 表中新增两个产品包：

```sql
-- 死了吗安全打卡
INSERT INTO packages (package_key, package_name, price, description, product_line, is_active, display_order)
VALUES ('alive_check', '死了吗安全打卡', 9.90, '每日安全确认 + 紧急联系人自动通知', 'youjin', true, 8);

-- 觉察日记系统
INSERT INTO packages (package_key, package_name, price, description, product_line, is_active, display_order)
VALUES ('awakening_system', '觉察日记', 9.90, '6维觉察入口 + AI生命卡片分析', 'youjin', true, 9);
```

---

### 文件修改清单

#### 1. 新建：死了吗轻量版入口

**`src/pages/AliveCheckLite.tsx`**
- 状态机：intro → main → (已购买直接使用，未购买显示支付弹窗)
- 入口直接显示功能界面
- 复用 `AliveCheck` 组件
- 使用 `AssessmentPayDialog` 弹窗（packageKey: `alive_check`）
- 首屏底部显示轻模式文字（未登录用户可见）

**`src/hooks/useAliveCheckPurchase.ts`**
- 新建 hook 检查用户是否已购买 `alive_check` 包

#### 2. 新建：觉察日记轻量版入口

**`src/pages/AwakeningLite.tsx`**
- 入口直接显示觉察日记主界面
- 复用现有 `Awakening` 页面组件逻辑
- 使用 `AssessmentPayDialog` 弹窗（packageKey: `awakening_system`）
- 首屏底部显示轻模式文字（未登录用户可见）

**`src/hooks/useAwakeningPurchase.ts`**
- 新建 hook 检查用户是否已购买 `awakening_system` 包

#### 3. 修改：Landing页面添加轻模式入口

**`src/pages/AliveCheckIntro.tsx`**
- 底部CTA区域添加"轻模式"文字链接
- 未登录用户显示"💡 先体验后付费 ¥9.9"文字
- 登录/已购买用户隐藏该文字
- 添加跳转到 `/alive-check-lite` 的入口

**`src/pages/AwakeningIntro.tsx`**
- 底部CTA区域添加"轻模式"文字链接
- 未登录用户显示"💡 先体验后付费 ¥9.9"文字
- 登录/已购买用户隐藏该文字
- 添加跳转到 `/awakening-lite` 的入口

#### 4. 修改：路由注册

**`src/App.tsx`**
```tsx
// 新增懒加载
const AliveCheckLite = lazy(() => import("./pages/AliveCheckLite"));
const AwakeningLite = lazy(() => import("./pages/AwakeningLite"));

// 新增路由
<Route path="/alive-check-lite" element={<AliveCheckLite />} />
<Route path="/awakening-lite" element={<AwakeningLite />} />
```

#### 5. 修改：浮动菜单排除

**`src/components/FloatingQuickMenu.tsx`**
```tsx
const EXCLUDED_ROUTES = [
  // ... 现有路由
  '/alive-check-lite',  // 新增
  '/awakening-lite',    // 新增
];
```

---

### 页面流程

#### 死了吗轻量版流程

```text
用户访问 /alive-check-lite
         │
         ▼
  ┌─────────────────┐
  │  功能主界面      │ ◄─── 直接进入，可体验设置联系人/打卡
  │  (底部：轻模式   │
  │   付费提示)      │
  └────────┬────────┘
           │ 用户尝试核心操作（如添加联系人/打卡）
           │
     ┌─────┴─────┐
     │           │
  已购买?     未购买?
     │           │
     ▼           ▼
 正常使用    弹出支付弹窗
             ───────────┐
                        │
              支付成功后 │
     ┌──────────────────┘
     ▼
   正常使用
```

#### 觉察日记轻量版流程

```text
用户访问 /awakening-lite
         │
         ▼
  ┌─────────────────┐
  │  觉察日记主界面  │ ◄─── 直接显示6维觉察入口
  │  (底部：轻模式   │
  │   付费提示)      │
  └────────┬────────┘
           │ 用户点击任一维度
           │
     ┌─────┴─────┐
     │           │
  已购买?     未购买?
     │           │
     ▼           ▼
 正常记录    弹出支付弹窗
             ───────────┐
                        │
              支付成功后 │
     ┌──────────────────┘
     ▼
   正常使用
```

---

### 底部轻模式文字设计

未登录/未购买用户在Landing页面底部可见：

```tsx
<div className="mt-6 pt-4 border-t border-border/30 space-y-3 text-center">
  <a 
    href="/alive-check-lite" 
    className="text-muted-foreground text-sm block hover:text-primary transition-colors"
  >
    💡 先体验后付费 ¥9.9
  </a>
  <p className="text-muted-foreground text-xs">
    北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
  </p>
</div>
```

登录且已购买用户：隐藏该区域。

---

### 样式主题

| 功能 | 主色调 | 渐变 |
|------|--------|------|
| 死了吗 | 玫红色 | `from-rose-500 to-pink-500` |
| 觉察日记 | 琥珀橙 | `from-amber-500 to-orange-500` |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/AliveCheckLite.tsx` | 新建 | 死了吗轻量版页面 |
| `src/pages/AwakeningLite.tsx` | 新建 | 觉察日记轻量版页面 |
| `src/hooks/useAliveCheckPurchase.ts` | 新建 | 死了吗购买状态hook |
| `src/hooks/useAwakeningPurchase.ts` | 新建 | 觉察日记购买状态hook |
| `src/pages/AliveCheckIntro.tsx` | 修改 | 添加轻模式入口文字 |
| `src/pages/AwakeningIntro.tsx` | 修改 | 添加轻模式入口文字 |
| `src/App.tsx` | 修改 | 添加两个新路由 |
| `src/components/FloatingQuickMenu.tsx` | 修改 | 排除新路由 |
| 数据库迁移 | 新建 | 添加两个产品包 |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 复用组件 | 复用 `AliveCheck`、`Awakening` 核心组件 |
| 支付弹窗 | 使用通用 `AssessmentPayDialog` |
| 购买验证 | 类似其他测评的 `useAssessmentPurchase` 模式 |
| 条件显示 | 轻模式文字仅对未登录/未购买用户显示 |
| 动画兼容 | 使用 `opacity: 0.01` 和 `translateZ(0)` 确保微信兼容 |

---

### 验收标准

1. ✅ `/alive-check-lite` 入口可直接体验功能
2. ✅ `/awakening-lite` 入口可直接查看6维觉察
3. ✅ 核心操作时触发 ¥9.9 付费弹窗
4. ✅ Landing页面底部显示轻模式入口（未购买用户可见）
5. ✅ 登录/已购买用户自动隐藏轻模式提示
6. ✅ 支付成功后可正常使用全部功能
