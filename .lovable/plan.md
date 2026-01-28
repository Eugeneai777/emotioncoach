
# 实现有劲合伙人体验包选择功能

## 实现内容

### 1. 数据库迁移
在 `partners` 表添加 `selected_experience_packages` 字段：
- 类型：`text[]`（PostgreSQL 数组）
- 默认值：全选 `['basic', 'emotion_health_assessment', 'scl90_report']`

### 2. 前端组件修改
更新 `EntryTypeSelector.tsx`：
- 添加体验包选择 UI（复选框列表）
- 支持"全选"快捷操作
- 至少选中一项才能保存
- 仅在"尝鲜会员"模式下显示

### 3. Edge Function 修改
更新 `claim-partner-entry/index.ts`：
- 查询合伙人的 `selected_experience_packages` 配置
- 根据配置条件性发放 AI 点数和测评权限

### 4. TypeScript 类型更新
更新 `usePartner.ts` 中的 Partner 接口

## 技术细节

### 数据库 SQL
```sql
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS selected_experience_packages text[] 
DEFAULT ARRAY['basic', 'emotion_health_assessment', 'scl90_report'];
```

### 体验包选项
| key | 显示名称 |
|:----|:--------|
| `basic` | AI对话点数 (50点) |
| `emotion_health_assessment` | 情绪健康测评 |
| `scl90_report` | SCL-90心理测评 |

### 条件发放逻辑
```typescript
const selectedPackages = partner.selected_experience_packages 
  || ['basic', 'emotion_health_assessment', 'scl90_report'];

if (selectedPackages.includes('basic')) {
  // 发放 AI 点数
}

if (selectedPackages.includes('emotion_health_assessment')) {
  // 创建情绪健康测评订单
}

if (selectedPackages.includes('scl90_report')) {
  // 创建 SCL-90 订单
}
```

## 文件清单
| 文件 | 操作 |
|:----|:-----|
| 数据库迁移 | 新增字段 |
| `src/components/partner/EntryTypeSelector.tsx` | 添加多选 UI |
| `src/hooks/usePartner.ts` | 更新类型定义 |
| `supabase/functions/claim-partner-entry/index.ts` | 条件发放逻辑 |
