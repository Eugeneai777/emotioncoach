
## 三个页面同步左上角有劲AI Logo

### 问题

以下三个页面使用了自定义 header，缺少左上角有劲AI Logo：

| 页面 | 路由 | 当前状态 |
|------|------|----------|
| 线上课程 | `/courses` | 只有"返回"按钮，无 Logo |
| 训练营列表 | `/camps` | 只有"返回"按钮，无 Logo |
| 合伙人类型选择 | `/partner/type` | 只有"返回首页"按钮，无 Logo |

### 修改方案

统一在每个页面的返回按钮前添加有劲AI Logo（与 `PageHeader` 组件保持一致的品牌规范）：

**1. `/courses` - src/pages/Courses.tsx**

在"返回"按钮左侧添加 Logo（点击回首页），保持现有布局不变。

**2. `/camps` - src/pages/CampList.tsx**

在 header 的"返回"按钮左侧添加 Logo（点击回首页），同时更新加载态骨架屏的 header。

**3. `/partner/type` - src/pages/PartnerTypeSelector.tsx**

在"返回首页"按钮左侧添加 Logo（点击回首页）。

### 技术细节

- 导入 `logoImage from "@/assets/logo-youjin-ai.png"`
- Logo 规格：`w-9 h-9 md:w-12 md:h-12 rounded-full object-cover`（与 PageHeader 一致）
- 点击跳转 `/`，包含 `active:scale-95 transition-transform` 触感反馈
- 在非首页时显示 `cursor-pointer`

### 涉及文件

- `src/pages/Courses.tsx`
- `src/pages/CampList.tsx`
- `src/pages/PartnerTypeSelector.tsx`
