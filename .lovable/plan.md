

## 简化优化：有劲飞轮 + 知乐命名统一

### 改动概览

根据截图和需求，将系统名称统一为"有劲飞轮"，合伙人名称使用"知乐"，同时简化 Dashboard 布局和飞轮层级展示。

### 一、命名统一

**FlywheelGrowthSystem.tsx**
- 标题从 `有劲AI · 四级增长飞轮` 改为 `有劲飞轮`
- 去掉 emoji 图标 `🔄`，使用更简洁的样式

**IndustryPartnerManagement.tsx**
- 页面标题保持 `行业合伙人 — {company_name}`（知乐是具体合伙人名，已通过数据库动态显示）
- 按钮文案 `飞轮详情` 改为 `查看飞轮`
- 描述文案简化

### 二、Dashboard 卡片简化（FlywheelGrowthSystem.tsx）

当前 5 个卡片信息密度过高，简化为更清晰的布局：

- 合并"活跃活动"和"总投放"为一行紧凑展示（非卡片）
- 保留 3 个核心指标卡片：**触达 / 转化 / 收入**（含趋势线和增长率）
- 顶部增加一行轻量摘要：`3 个活跃活动 · 总投放 ¥X,XXX`

### 三、飞轮层级 Tab 简化

- 去掉 Tab 内重复的层级标题和描述（已在 Tab 标签上显示）
- 统计卡片从 3 个独立卡片改为一行内联数字
- "设置推广活动" 按钮保持不变

### 技术细节

**文件修改清单**：
- `src/components/partner/FlywheelGrowthSystem.tsx`
  - 标题改为"有劲飞轮"
  - Dashboard 从 5 卡片简化为顶部摘要行 + 3 核心卡片
  - Tab 内容区去掉层级标题行，统计改为内联
- `src/components/admin/IndustryPartnerManagement.tsx`
  - 按钮文案微调

**Dashboard 新布局**：
```text
有劲飞轮
3 个活跃活动 · 总投放 ¥0          <-- 轻量摘要行

[触达 card + sparkline]  [转化 card + sparkline]  [收入 card + sparkline]

[L1 Tab] [L2 Tab] [L3 Tab] [L4 Tab]
  触达 12 · 转化 3 · 收入 ¥299     <-- 内联数字
  [设置推广活动]
  [推广活动列表]
```

