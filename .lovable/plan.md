

## 标题合并：有劲飞轮 · 知乐胶囊

### 改动内容

**1. 页面标题更新 (`IndustryPartnerManagement.tsx`)**
- 第 177 行：将 `行业合伙人 — ${selectedPartner.company_name}` 改为 `有劲飞轮 · ${selectedPartner.company_name}胶囊`
- 例如知乐合伙人会显示为："有劲飞轮 · 知乐胶囊"

**2. 去掉飞轮系统内部重复标题 (`FlywheelGrowthSystem.tsx`)**
- 第 190 行：移除 "有劲飞轮" 的 `<h2>` 标题，因为已经合并到页面顶部标题中
- 保留活跃活动数和总投放金额的摘要信息

### 涉及文件
- `src/components/admin/IndustryPartnerManagement.tsx`
- `src/components/partner/FlywheelGrowthSystem.tsx`
