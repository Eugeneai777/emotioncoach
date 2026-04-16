

# 更新 SOURCE_LABELS 映射表

## 改动内容

在 `src/components/VoiceUsageSection.tsx` 中：

1. **移除** `elevenlabs_voice`（不存在于映射表中，无需操作 — 确认当前文件确实没有此 key ✓）
2. **修改** 第 32 行：`courses_page` → `"学习课程"`
3. **修改** 第 36 行：`camp_video_tasks` → `"训练营课程"`
4. **修改** 第 33-35 行：`recommend_courses` / `recommend_courses_v2` / `video_recommendations` → `"AI推荐课程"`

`humanizeDescription` 函数已自动使用 `SOURCE_LABELS` 做替换，无需额外改动。

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/components/VoiceUsageSection.tsx` | 修改 4 个映射值（第 32-36 行） |

约 4 行修改，纯前端，不影响任何其他逻辑。

