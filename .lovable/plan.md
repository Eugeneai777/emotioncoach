

## 合并 Lisa 重复账号

### 背景
Lisa (手机号 15109251240) 存在两个账号：
- **主账号 A (`4b450663...`)**: 创建于 2月14日，持有绽放合伙人 L0 身份和免费测评订单
- **重复账号 B (`314a9dde...`)**: 创建于 2月15日，无任何权益数据

Lisa 当前通过账号 B 登录，因此看到需要支付 9.9 元的提示。

### 执行操作

对重复账号 B (`314a9dde...`) 执行软删除：

```sql
UPDATE profiles 
SET deleted_at = NOW(),
    is_disabled = true, 
    disabled_at = NOW(),
    disabled_reason = '重复账号已合并至主账号 4b450663',
    phone = NULL
WHERE id = '314a9dde-a87f-4c7a-a9b1-4e5b128b5e8f';
```

操作完成后，Lisa 用 15109251240 登录将自动匹配到主账号 A，即可正常使用合伙人权益和免费测评。

