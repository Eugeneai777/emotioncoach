

## 合并燕子重复账号

### 当前状态

- **主账号 (燕子, ce07469f...)**: 已有手机号 13752795990、合伙人权益 L0、免费测评订单 -- 数据完整，无需迁移
- **重复账号 (李燕渤, 19f3d436...)**: 同一手机号，无任何权益数据 -- 需要清理

### 执行步骤

**步骤 1: 软删除重复账号**

对账号 B (19f3d436...) 执行软删除：
- 设置 `deleted_at` 时间戳
- 设置 `is_disabled = true`
- 设置 `disabled_reason = '重复账号已合并至主账号 ce07469f'`
- 清空其 `phone` 字段，避免手机号冲突影响主账号登录

### 技术细节

通过数据库操作完成：
```sql
UPDATE profiles 
SET deleted_at = NOW(),
    is_disabled = true, 
    disabled_at = NOW(),
    disabled_reason = '重复账号已合并至主账号 ce07469f',
    phone = NULL
WHERE id = '19f3d436-2907-4f22-964d-56fadec51805';
```

无需修改代码文件，仅需一次数据库更新操作。

