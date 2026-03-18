

## 实施方案

### 概要

三件事：1）数据库配置让女性竞争力测评变为 ¥9.9 付费；2）mini-app 页面两张卡片添加角标；3）新建测评选择底部弹窗组件。

---

### 1. 数据库变更（2 条 SQL）

**a) 在 `packages` 表插入女性竞争力测评的套餐记录：**

```sql
INSERT INTO packages (package_name, package_key, price, ai_quota, duration_days, is_active, display_order)
VALUES ('35+女性竞争力测评', 'women_competitiveness_assessment', 9.9, 0, NULL, true, 51);
```

**b) 更新 `partner_assessment_templates` 中女性竞争力模板：**

```sql
UPDATE partner_assessment_templates 
SET require_payment = true, package_key = 'women_competitiveness_assessment'
WHERE assessment_key = 'women_competitiveness';
```

无需改动代码端付费逻辑 — `DynamicAssessmentPage` 已内置 `require_payment` + `package_key` 的门控机制，会自动读取模板配置弹出付费弹窗。

中场觉醒力测评已有 `midlife_awakening_assessment` 套餐（¥9.9、is_active=true），且 `MidlifeAwakeningPage` 已内置付费门控，无需改动。

---

### 2. 新建 `src/components/mini-app/AssessmentPickerSheet.tsx`

底部弹窗组件，使用已有 `Sheet` 组件：

- Props: `open`, `onOpenChange`, `assessments` 数组（每项含 emoji、title、sub、route、price）
- 渲染：标题 "选一个适合你的测评" + 两张选择卡片
- 每张卡片显示 emoji、标题、描述、价格标签（橙色 `bg-orange-100 text-orange-600`）
- 点击卡片 → `navigate(route)` 并关闭弹窗

---

### 3. 修改 `src/pages/MiniAppEntry.tsx`

**a) audiences 数据增加 badge 字段：**

```typescript
{ id: "workplace", ..., badge: {
  text: "¥9.9测评",
  assessments: [
    { emoji: "👑", title: "35+女性竞争力", sub: "25题·7分钟", route: "/assessment/women_competitiveness", price: "¥9.9" },
    { emoji: "💚", title: "情绪健康测评", sub: "PHQ-9+GAD-7·5分钟", route: "/emotion-health", price: "¥9.9" },
  ]
}},
{ id: "midlife", ..., badge: {
  text: "¥9.9测评",
  assessments: [
    { emoji: "💰", title: "财富卡点测评", sub: "20题·6分钟", route: "/wealth-block", price: "¥9.9" },
    { emoji: "🧭", title: "中场觉醒力测评", sub: "6维度·30题·8分钟", route: "/midlife-awakening", price: "¥9.9" },
  ]
}},
```

其他 4 张卡片 `badge: null`。

**b) 卡片渲染增加角标 UI：**

在每张卡片的 `motion.button` 内部，根据 `a.badge` 是否存在，渲染右上角胶囊角标：
- 定位：`absolute top-1.5 right-1.5 z-20`
- 样式：`bg-white/85 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm`
- 文字：`text-[10px] font-bold text-orange-600`
- 点击事件：`e.stopPropagation()` 阻止卡片跳转 + 打开 AssessmentPickerSheet

**c) 引入 state 和 Sheet 组件：**

新增 `selectedBadge` state，点击角标时设置当前 badge 的 assessments，打开 Sheet。

---

### 业务影响确认

| 项目 | 影响 |
|------|------|
| 女性竞争力测评 | 从免费变为 ¥9.9 付费（历史已完成记录不受影响）|
| 中场觉醒力测评 | 维持现状（已是 ¥9.9 付费）|
| 情绪健康/财富卡点 | 维持现状（已是 ¥9.9 付费）|
| mini-app 页面 | 职场解压 + 中年觉醒卡片右上角新增角标 |

