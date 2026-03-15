

## 修复 18135536098 登录 — 补齐 email_confirmed_at

**唯一改动**：对用户 `69f66ed2-c71e-45e7-b6e1-1033bda0c2da` 执行一条 UPDATE，将 `email_confirmed_at` 设为当前时间（仅在其为 NULL 时生效）。

不修改任何前端代码、不触碰其他用户数据、不改其他字段。

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE id = '69f66ed2-c71e-45e7-b6e1-1033bda0c2da' 
  AND email_confirmed_at IS NULL;
```

执行方式：通过数据库迁移工具运行此 SQL。

