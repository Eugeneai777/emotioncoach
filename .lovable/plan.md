

## 修改计划

将数据库中 `energy_studio_tools` 表里 `alive-check` 工具的标题从"死了吗"改为"每日安全守护"。

### 改动

**数据库迁移**（1条 SQL）：
```sql
UPDATE energy_studio_tools 
SET title = '每日安全守护' 
WHERE tool_id = 'alive-check';
```

仅此一处改动，无需修改前端代码。

