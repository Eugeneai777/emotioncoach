

## 行业合伙人详情页固定转化飞轮

### 需求理解
在行业合伙人详情页（admin端和partner端）的Tab内容区域**上方**，固定显示一个紧凑的转化飞轮摘要条，让运营者无论切换到哪个Tab，都能一眼看到该合伙人的核心转化数据（体验→入群→365→合伙人）。

### 方案

#### 1. IndustryPartnerDetail.tsx（管理员端）
- 在 `<Tabs>` 组件内、导航栏下方、`<TabsContent>` 上方，插入 `<CompactConversionFunnel>` 组件
- 点击飞轮时自动切换到 "students" Tab
- 始终可见，不随Tab切换消失

#### 2. IndustryPartnerDashboard.tsx（合伙人端）
- 在 Header Card 下方、Tabs 导航上方，插入 `<CompactConversionFunnel>`
- 点击时切换到学员相关功能（如果有的话，否则仅展示）

#### 涉及文件

| 文件 | 改动 |
|------|------|
| `IndustryPartnerDetail.tsx` | 导入 CompactConversionFunnel，在Tab导航与TabsContent之间插入 |
| `IndustryPartnerDashboard.tsx` | 导入 CompactConversionFunnel，在Header与Tabs之间插入 |

改动量很小，每个文件仅增加约5行代码。

