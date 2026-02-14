

# 邀请列表状态手动调整功能

## 需求
在邀请列表的每一行"操作"列中，增加一个下拉菜单，允许管理员手动修改邀请状态，包括新增一个"不需领取"状态选项。

## 改动内容

### 1. 数据库：新增状态值支持
- `partner_invitations.status` 当前支持 `pending`、`claimed`、`expired`
- 新增 `skipped` 状态值，表示"不需领取"
- 无需 migration（status 字段为 text 类型，直接支持新值）

### 2. BloomPartnerInvitations.tsx 改动

**操作列增强**：将每行的操作区域从单一"复制链接"按钮改为包含状态切换的下拉菜单（DropdownMenu），提供以下选项：
- 复制邀请链接（仅 pending 状态显示）
- 设为"待领取"（pending）
- 设为"已领取"（claimed）
- 设为"已过期"（expired）
- 设为"不需领取"（skipped）-- 新增

**状态变更逻辑**：点击后通过 `supabase.from('partner_invitations').update({ status }).eq('id', inv.id)` 直接更新，成功后刷新列表。

**Badge 和筛选器同步更新**：
- `getStatusBadge` 新增 `skipped` 的蓝灰色 Badge 显示"不需领取"
- 状态筛选下拉框新增"不需领取"选项
- 统计卡片新增"不需领取"计数

### 3. 涉及文件
- `src/components/admin/BloomPartnerInvitations.tsx`（唯一需修改的文件）

