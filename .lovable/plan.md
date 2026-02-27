
# 亲子沟通测评 - 历史记录 + 训练营推荐

## 概述

参考财富卡点测评的 Tabs 架构，为亲子沟通测评增加历史记录保存/展示功能，以及结果页底部的亲子训练营推荐卡片。

---

## 一、页面架构改造

将 `CommunicationAssessment.tsx` 从简单的 phase 状态机改造为 **Tabs 架构**（参考 `WealthBlockAssessment.tsx`）：

- **Tab: assessment** - 介绍页 / 答题 / 结果展示
- **Tab: history** - 历史记录列表
- **底部固定导航栏**：重新测评 | 历史记录（两栏布局）

### 状态管理
- `activeTab`: 'assessment' | 'history'
- `showResult` / `currentResult` / `historyRecords` 等
- 用户登录后自动加载历史数据
- 测评完成后自动保存（复用现有 `saveResult` 逻辑，移至父组件统一管理）

---

## 二、历史记录组件

### 新建: `CommAssessmentHistory.tsx`

参考 `WealthBlockHistory.tsx`，显示：
- 每条记录：主要沟通模式 emoji + 名称、视角标签（家长/青少年）、日期
- 六维度得分条（倾听/共情/边界/表达/冲突/理解）
- 支持点击查看详情（切回结果页展示该记录）
- 支持删除（带确认弹窗）
- 空状态提示

---

## 三、结果页增加训练营推荐

### 修改: `CommAssessmentResult.tsx`

在 AI 建议区域下方、邀请码上方，添加亲子训练营推荐卡片：
- 推荐 `parent_emotion_21`（21天青少年困境突破营）
- 卡片样式参考 `CampRecommendationCard`：图标 + 营名 + 天数 + 推荐理由
- 推荐理由根据测评结果的主模式动态生成（如控制型 -> "学习更有效的亲子沟通方式"）
- 点击跳转 `/camp-intro?type=parent_emotion_21`

---

## 四、技术细节

### 文件变更

| 文件 | 操作 |
|------|------|
| `src/pages/CommunicationAssessment.tsx` | 重写：Tabs 架构 + 底部导航栏 + 历史记录加载/删除 + 重新测评 |
| `src/components/communication-assessment/CommAssessmentResult.tsx` | 修改：添加训练营推荐卡片 + 接收 `onRetake` 回调 |
| `src/components/communication-assessment/CommAssessmentHistory.tsx` | 新建：历史记录列表组件 |

### 数据库
- 已有 `communication_pattern_assessments` 表，无需新建迁移
- 现有的 `saveResult` 逻辑已在 `CommAssessmentResult` 中，将保留并优化

### 底部导航栏结构
```text
+-------------------------------+
|  重新测评     |    历史记录     |
|  (RotateCcw)  |   (History)    |
+-------------------------------+
```

### 训练营推荐理由映射
- controlling (控制型) -> "学习用引导代替命令，建立信任关系"
- dismissive (忽视型) -> "重建亲子情感连接，学会回应与陪伴"
- anxious (焦虑型) -> "管理自身焦虑，给孩子成长空间"
- democratic (民主型) -> "进一步巩固优秀的沟通模式"

---

## 五、实现顺序

1. 新建 `CommAssessmentHistory.tsx` 历史记录组件
2. 改造 `CommunicationAssessment.tsx` 为 Tabs 架构 + 底部导航
3. 修改 `CommAssessmentResult.tsx` 添加训练营推荐卡片 + onRetake
