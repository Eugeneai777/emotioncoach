

# 修改"藏汐老师"为"黛汐老师"

## 问题
数据库 `camp_templates` 表中 `emotion_bloom` 记录的 `learning_formats` JSON 里，直播课描述写的是"藏汐老师答疑"，应为"黛汐老师答疑"。

## 改动
执行一条 SQL 更新，将 `learning_formats` 中直播课的 description 从"每阶每周六，藏汐老师答疑"改为"每阶每周六，黛汐老师答疑"。

**SQL migration**:
```sql
UPDATE camp_templates
SET learning_formats = jsonb_set(
  learning_formats::jsonb,
  '{2,description}',
  '"每阶每周六，黛汐老师答疑"'
)
WHERE camp_type = 'emotion_bloom';
```

零代码改动，纯数据库修复。

