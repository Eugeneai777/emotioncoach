
# 批量注册用户状态显示优化

## 问题

截图中的7个用户是通过"一键注册并发放权益"批量处理的已有用户，虽然 `claimed_by` 有值，但并非用户自行领取，而是系统自动匹配并发放的。当前显示为绿色"已领取"，与用户主动领取的无法区分。

## 当前状态分类

| 场景 | status | claimed_by | 当前显示 |
|------|--------|------------|----------|
| 用户自行领取 | claimed | 有值 | 已领取（绿色） |
| 管理员手动设置 | claimed | NULL | 管理员（紫色） |
| 批量注册处理 | claimed | 有值 | 已领取（绿色）-- 无法区分 |

## 方案

在 `partner_invitations` 表新增 `claimed_source` 字段，标记领取来源：

- `self` - 用户自行领取
- `batch` - 批量注册系统处理  
- `admin` - 管理员手动操作

### 修改内容

**1. 数据库迁移**

在 `partner_invitations` 表新增 `claimed_source` 列：

```sql
ALTER TABLE public.partner_invitations 
ADD COLUMN claimed_source text DEFAULT 'self';

-- 将现有管理员操作的记录标记
UPDATE public.partner_invitations 
SET claimed_source = 'admin' 
WHERE status = 'claimed' AND claimed_by IS NULL;

-- 将批量注册的7条记录标记
UPDATE public.partner_invitations 
SET claimed_source = 'batch' 
WHERE invite_code IN ('BLOOM-MX42','BLOOM-TZ44','BLOOM-FQ45','BLOOM-DZ47','BLOOM-ED49','BLOOM-LQ51','BLOOM-MM53');
```

**2. Edge Function 修改**

`supabase/functions/batch-register-bloom-partners/index.ts`：更新邀请状态时增加 `claimed_source: 'batch'`：

```typescript
await adminClient.from('partner_invitations').update({
  status: 'claimed',
  claimed_by: userId,
  claimed_at: new Date().toISOString(),
  claimed_source: 'batch',
}).eq('id', inv.id);
```

**3. 前端显示修改**

`src/components/admin/BloomPartnerInvitations.tsx`：

- 修改 `getStatusBadge` 函数，根据 `claimed_source` 区分显示：
  - `batch` -> 蓝色 Badge "系统注册"
  - `admin` -> 紫色 Badge "管理员"（替代当前 claimed_by 为空的判断）
  - `self` -> 绿色 Badge "已领取"

- 领取时间列对应显示"系统注册"或"管理员操作"

### 最终显示效果

| 场景 | Badge | 颜色 |
|------|-------|------|
| 用户自行领取 | 已领取 | 绿色 |
| 批量注册处理 | 系统注册 | 蓝色 |
| 管理员手动 | 管理员 | 紫色 |
| 待领取 | 待领取 | 黄色 |
| 不需领取 | 不需领取 | 灰色 |
