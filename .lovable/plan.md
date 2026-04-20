
## 任务
将 `/emotion-health` 情绪健康测评价格从 ¥9.9 改为 ¥0.01（用于测试）。

## 排查
价格通常存储在后端 `assessment_packages` 表（按 `package_key='emotion_health_assessment'` 索引），前端 `AssessmentPayDialog` 通过 hook 读取。需要先确认价格来源是数据库还是前端硬编码。
