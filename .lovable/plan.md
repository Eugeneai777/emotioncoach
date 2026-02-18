

# 修复 13752795990 和 18135536098 重复账号问题

## 问题诊断

每个手机号在 auth.users 中存在两条记录：
- **账号A**（手机注册）：有 phone 字段，email 为空 -- 这是 profiles 表关联的主账号
- **账号B**（批量创建）：有占位邮箱，phone 为空 -- 这是多余的重复账号

backfill 函数无法给账号A写入占位邮箱，因为该邮箱已被账号B占用，触发唯一约束冲突。

## 修复步骤

### 第 1 步：检查重复账号是否有关联数据

在删除账号B之前，需要检查 partners、orders、user_camp_purchases 等表是否有绑定到账号B的权益数据。如果有，需要先迁移到账号A。

### 第 2 步：删除重复的占位邮箱账号（账号B）

通过已有的 `cleanup-duplicate-user` edge function 删除两个多余账号：
- `19f3d436-2907-4f22-964d-56fadec51805`（13752795990 的重复）
- `ebb5519c-e88c-46aa-a42a-140eead21287`（18135536098 的重复）

### 第 3 步：为手机账号（账号A）写入占位邮箱

再次调用 `backfill-placeholder-emails` 函数，或通过 `cleanup-duplicate-user` 的 `update-auth-user` action 直接写入：
- `ce07469f...` -> email: `phone_8613752795990@youjin.app`
- `69f66ed2...` -> email: `phone_8618135536098@youjin.app`

### 第 4 步：验证修复结果

查询确认两个用户的 auth.users 记录正确：有 phone + 有 email。

## 技术细节

- 使用现有的 `cleanup-duplicate-user` edge function 执行删除和更新操作（需要 service_role 权限）
- 操作顺序必须是：先检查数据迁移需求 -> 删除重复账号 -> 写入占位邮箱
- 整个流程通过 edge function 调用完成，无需修改代码

