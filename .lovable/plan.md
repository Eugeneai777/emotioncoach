

# 新用户注册赠送 50 点

## 当前情况
数据库触发器 `handle_new_user_account` 在新用户注册时创建账户，当前设置 `total_quota = 0`。

## 修改内容

**数据库函数更新**（通过迁移工具）：

将 `handle_new_user_account` 函数中的 `total_quota` 从 0 改为 50：

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

无需修改前端代码，用完 50 点后现有的充值/购买流程继续生效。

**注意**：此改动只影响新注册用户，已有用户的额度不变。

