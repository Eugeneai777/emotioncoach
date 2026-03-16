

# /platform-intro 页面简化方案

## 当前问题
909行代码，包含 **8个板块**：Hero、使命愿景、核心价值、四层支持、教练空间、生活馆、合伙人、快捷入口。信息过载，用户难以抓住重点。

## 简化策略：保留3个核心板块 + 1个导航

### 删除的板块
| 板块 | 原因 |
|------|------|
| 使命与愿景卡片 | 对新用户无吸引力，可在"关于"页查看 |
| 核心价值横向滚动 | 抽象概念，不如直接体验 |
| 教练空间（含教练列表） | 四层支持已涵盖，教练空间有独立入口 |
| 有劲生活馆（工具分类+功能入口） | 生活馆有独立入口，此处重复 |
| 合伙人体系 | 非核心用户路径，适合独立页面 |
| 底部 CTA 卡片 | Hero已有CTA，重复 |

### 保留并优化的板块
1. **Hero区**（核心定义 + 痛点 + 改变 + CTA）— 不变
2. **四层支持系统** — 保留，这是核心差异化
3. **快捷入口导航** — 保留，作为"更多了解"的统一出口

### 同时删除的数据和代码
- `platformCoreValues`、`coachCoreValues`、`coachEmojiMap`、`coachScenarios`、`coachGradientMap`、`studioKeyFeatures`、`partnerTypes` 数据数组
- `useActiveCoachTemplates` hook 调用和相关 loading 逻辑
- `toolCategories` import
- 未使用的图标 imports（Clock, Lock, GraduationCap, BookOpen, Users 等）
- `scaleVariants`、`slideVariants` 动画变体（如不再使用）
- 骨架屏中对应的骨架区块精简

### 文件改动
| 文件 | 改动 |
|------|------|
| `src/pages/PlatformIntro.tsx` | 从909行精简至约350行，删除5个板块及相关数据/imports |

