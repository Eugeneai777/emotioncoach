

## 将管理员充值套餐的视频课程扣费改为 1 点

### 当前状态

| 套餐 | video_courses cost_per_use |
|------|---------------------------|
| 尝鲜会员 | 1 |
| 365会员 | 1 |
| 管理员充值套餐 | **0（不扣费）** |

### 改动

通过数据库更新，将管理员充值套餐的 `video_courses` 的 `cost_per_use` 从 `0` 改为 `1`。

### 技术细节

执行一条 SQL 更新语句：

```sql
UPDATE package_feature_settings 
SET cost_per_use = 1 
WHERE id = '3882cd34-f7a1-4409-9244-a3fd53b9c0b9';
```

改动后所有套餐观看视频都会扣 1 点，无需修改任何前端或后端代码。

