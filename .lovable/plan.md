

# 修改 parent_emotion_21 训练营价格为 ¥1

通过数据库更新将「21天青少年困境突破营」的价格从 ¥299 改为 ¥1。

## 执行内容

使用数据插入工具执行以下 SQL：

```sql
UPDATE camp_templates 
SET price = 1, updated_at = now() 
WHERE camp_type = 'parent_emotion_21';
```

无需修改前端代码，价格从数据库动态读取。

