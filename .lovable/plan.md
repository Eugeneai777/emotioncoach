

# 将张辉的区号改为美国 (+1)

## 当前状态

记录 `BLOOM-ZH09`（张辉/light，手机号 `610-909-8999`）的区号目前为 `+86`（中国），需要改为 `+1`（美国）。

## 操作

执行一条数据库更新语句：

```text
UPDATE partner_invitations 
SET invitee_phone_country_code = '+1' 
WHERE id = 'b0ee0e85-a300-417a-a1a1-a8b45046798a';
```

这将确保后续批量注册时使用正确的美国区号 `+1` 拼接手机号。

