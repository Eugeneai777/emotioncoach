

# 亲子沟通测评结果页增强方案

## 概述

参考财富卡点测评的成熟架构，为亲子沟通测评结果页增加以下功能模块：

1. 亲子训练营推荐卡片
2. 亲子教练语音解说（底部导航栏 FAB 按钮）
3. 重新测评 + 历史记录（底部固定导航栏，Tabs 架构）
4. 分享功能（生成分享卡片）
5. 邀请孩子卡片（含邀请码 + 二维码）

---

## 一、页面架构改造

将 `CommunicationAssessment.tsx` 从简单的 phase 状态机改造为 Tabs 架构（参考 `WealthBlockAssessment.tsx`），包含：

- **Tab 1: 测评/结果**（介绍页 -> 答题 -> 结果展示）
- **Tab 2: 历史记录**（列表 + 趋势图）
- **底部固定导航栏**：重新测评 | 亲子教练解说(FAB) | 历史记录

### 页面状态管理
- `activeTab`: 'assessment' | 'history'
- `showResult` / `currentResult` / 历史记录列表等状态
- 用户登录后自动加载历史数据

---

## 二、结果页增强（CommAssessmentResult.tsx）

### 2.1 亲子训练营推荐卡片
在 AI 建议区域下方添加训练营推荐，推荐 `parent_emotion_21`（21天青少年困境突破营），点击跳转至 `/camp-intro?type=parent_emotion_21`。

### 2.2 分享功能
- 添加 `ShareInfoCard` 组件（复用现有的分享信息卡片模式）
- 生成包含测评结果摘要 + 品牌二维码的分享图片

### 2.3 邀请孩子/家长卡片
- 将现有的简单邀请码区域升级为完整的邀请卡片
- 包含二维码（扫码直达测评页 + 自动填入邀请码）
- 支持复制邀请码和链接
- 参考 `TeenInviteShareCard` 的卡片风格

### 2.4 重新测评按钮
- 底部添加 `onRetake` 回调，由父组件控制重置流程

---

## 三、亲子教练语音解说

### 3.1 新组件：CommAssessmentVoiceCoach
参考 `AssessmentVoiceCoach.tsx` 结构：
- 底部导航栏中间凸出 FAB 按钮（蓝色/天蓝渐变）
- 点击后打开 `CoachVoiceChat` 语音对话
- 传入测评结果数据（维度得分、模式类型）
- 使用现有的 `parent-realtime-token` 或新建专用 token endpoint
- 通话结束后可选显示后续引导

### 3.2 Edge Function
- 复用或扩展现有的亲子教练 realtime token endpoint
- 将测评结果注入 system prompt，让教练基于测评数据进行针对性解说

---

## 四、历史记录

### 4.1 新组件：CommAssessmentHistory
参考 `WealthBlockHistory.tsx`，显示：
- 历史测评记录列表
- 每条记录显示：主要模式、视角（家长/青少年）、日期、六维得分条
- 支持删除和查看详情

### 4.2 新组件：CommAssessmentTrend
参考 `WealthBlockTrend.tsx`，用折线图展示得分趋势变化。

---

## 五、新建/修改文件清单

### 新建文件
1. `src/components/communication-assessment/CommAssessmentVoiceCoach.tsx` - 语音教练 FAB 按钮
2. `src/components/communication-assessment/CommAssessmentHistory.tsx` - 历史记录列表
3. `src/components/communication-assessment/CommAssessmentTrend.tsx` - 趋势图
4. `src/components/communication-assessment/CommAssessmentShareCard.tsx` - 分享卡片
5. `src/components/communication-assessment/CommInviteCard.tsx` - 邀请孩子卡片（含二维码）

### 修改文件
1. `src/pages/CommunicationAssessment.tsx` - 改造为 Tabs 架构 + 底部导航栏 + 历史记录
2. `src/components/communication-assessment/CommAssessmentResult.tsx` - 添加训练营推荐、分享、邀请卡片、重新测评回调

---

## 六、实现顺序

1. 改造页面为 Tabs 架构（重新测评 + 历史记录导航）
2. 增强结果页（训练营推荐 + 分享 + 邀请卡片）
3. 创建历史记录和趋势组件
4. 创建语音教练 FAB 组件
5. 创建分享和邀请卡片组件

