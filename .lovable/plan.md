## 完成最后收尾：注册数据洞察路由

前面所有埋点与 `CampInsightsDetail.tsx` 组件均已就位，仅剩路由注册这一步未完成。

### 改动（仅 1 个文件）

**`src/components/admin/AdminLayout.tsx`**（第 148 行附近）

在 `<Route path="camps" element={<CampTemplatesManagement />} />` 下方新增：

```tsx
<Route path="camps/:campKey/insights" element={<CampInsightsDetail />} />
```

`CampInsightsDetail` 已在第 16 行导入，无需再加 import。

### 验证

1. 进入 后台 → 内容管理 → 训练营管理
2. 在【7天有劲训练营】卡片点击「数据洞察」
3. 跳转到 `/admin/camps/emotion_stress_7/insights`，可见 总览 / 售前转化 / 学习交付 三个 Tab
4. 切换日期筛选，确认数据加载正常

### 不在本次范围

- 不改业务逻辑、不动支付、不动 DB
- 21 天训练营卡片的「数据洞察」按钮保持禁用，待后续埋点完成再开放
