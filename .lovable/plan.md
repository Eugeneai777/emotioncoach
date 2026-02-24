
## 统一佣金比例数据源

### 问题
佣金比例数据存在两套来源：数据库 `partner_level_rules` 表和前端硬编码文件 `src/config/partnerLevels.ts`。管理后台修改数据库后，多个使用硬编码的页面不会同步更新。

### 解决方案
将所有引用硬编码配置的组件改为使用 `usePartnerLevels` hook 从数据库读取，确保管理后台改了比例后全站同步生效。

---

### 需要修改的文件

#### 1. `src/pages/PartnerBenefitsUnified.tsx`（权益对比页）
- 移除 `import { bloomPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels"`
- 改用 `usePartnerLevels()` hook 获取数据
- 从 `levels` 数组中筛选出绽放和有劲 L1/L2/L3 的佣金比例
- 添加 loading 状态处理

#### 2. `src/components/partner/PartnerOverviewCard.tsx`（合伙人中心概览卡片）
- 移除 `import { getPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels"`
- 改用 `usePartnerLevels('youjin')` 获取等级列表
- 用数据库数据计算当前等级、下一等级和升级进度

#### 3. `src/components/partner/PartnerLevelProgress.tsx`（等级进度条）
- 移除 `import { youjinPartnerLevels } from "@/config/partnerLevels"`
- 改用 `usePartnerLevels('youjin')` 获取等级列表

#### 4. `src/pages/YoujinPartnerIntro.tsx`（有劲合伙人介绍页）
- 移除 `import { youjinPartnerLevels } from "@/config/partnerLevels"`
- 改用 `usePartnerLevels('youjin')` 获取等级列表
- 将等级数据映射为页面所需格式

#### 5. `src/components/partner/MyFlywheelOverview.tsx`（飞轮概览）
- 移除 `import { getPartnerLevel } from "@/config/partnerLevels"`
- 改用 `usePartnerLevels()` 获取等级数据

### 不删除硬编码文件
保留 `src/config/partnerLevels.ts` 作为兜底/默认值，但所有 UI 页面统一从数据库读取。这样即使数据库暂时不可用，也有 fallback。

### 注意事项
- 每个组件需增加 loading 状态处理（数据库查询有延迟）
- `usePartnerLevels` hook 已有缓存和错误处理，直接复用
- 数据库字段名（`commission_rate_l1`）与前端接口名（`commissionRateL1`）不同，需做映射
