

# 婚因有道 AI 网站建设计划

## 概述
在现有项目中创建"婚因有道"完整网站，包含首页、婚姻测评、AI关系工具、专业服务、关于我们、获取帮助共6个页面，路由统一以 `/marriage` 为前缀。

## 页面与路由

| 页面 | 路由 |
|------|------|
| 首页 | `/marriage` |
| 婚姻测评中心 | `/marriage/assessments` |
| AI关系工具 | `/marriage/ai-tools` |
| 专业服务 | `/marriage/services` |
| 关于婚因有道 | `/marriage/about` |
| 获取帮助 | `/marriage/help` |

## 文件结构

```text
src/
├── pages/marriage/
│   ├── MarriageHome.tsx          # 首页（含所有模块）
│   ├── MarriageAssessments.tsx   # 测评中心
│   ├── MarriageAITools.tsx       # AI关系工具（吵架复盘器等）
│   ├── MarriageServices.tsx      # 专业服务
│   ├── MarriageAbout.tsx         # 关于婚因有道
│   └── MarriageHelp.tsx          # 获取帮助
├── components/marriage/
│   ├── MarriageNav.tsx           # 底部导航栏（6个入口）
│   ├── MarriageHero.tsx          # 首页首屏
│   ├── MarriagePainPoints.tsx    # 常见问题模块
│   ├── MarriageAssessmentCards.tsx # 5个测评卡片
│   ├── MarriageAIToolCards.tsx   # 3个AI工具卡片
│   ├── MarriageWhyUs.tsx         # 为什么选择婚因有道
│   ├── MarriageSteps.tsx         # AI+专业老师三步流程
│   ├── MarriageCTA.tsx           # 底部转化区
│   ├── MarriageFooter.tsx        # 页脚（公司信息）
│   └── MarriageQuarrelTool.tsx   # AI吵架复盘器交互组件
```

## 设计规范

- **主色**：`#6E4CA6`（柔和紫色），通过 Tailwind 自定义类实现
- **背景**：白色 + 浅紫渐变 `from-white via-purple-50/30 to-purple-100/20`
- **风格**：温暖疗愈风，圆角卡片（`rounded-2xl`），柔和阴影，无冷科技感
- **移动优先**：所有布局基于手机端设计，卡片单列排列
- **动画**：framer-motion 入场动画，与现有项目风格一致

## 首页模块（MarriageHome.tsx）

从上到下依次包含：
1. **首屏 Hero** — 标题"你的婚姻，现在处于什么状态？"，两个CTA按钮，底部信任说明三点
2. **常见问题** — 7个痛点场景列表 + "先做测评"按钮
3. **热门测评** — 5个测评卡片横向可滑动或纵向排列
4. **AI关系工具** — 3个工具卡片
5. **为什么选择** — 4个优势卡片（2x2网格）
6. **三步流程** — 测评→AI分析→专业咨询，纵向步骤图
7. **底部CTA** — 情感文案 + 两个按钮

## 婚姻测评页（MarriageAssessments.tsx）

- 5个测评卡片，每个包含标题、描述、"立即测评"按钮
- 点击后进入简化测评流程（复用项目现有的测评问答模式）
- 测评结果页输出：状态评分、关系阶段、主要问题、改善建议
- 结果页含"体验AI工具"和"预约咨询"按钮

## AI关系工具页（MarriageAITools.tsx）

- **AI吵架复盘器**：文本输入框 → 调用 Lovable AI（gemini-2.5-flash）分析 → 输出冲突核心、双方情绪、真实需求、误解点、修复建议
- **AI沟通教练**：输入委屈/情绪 → AI转化为更好的表达方式
- **AI关系日记**：记录入口（可后续扩展）

## 技术实现

- AI功能通过 Edge Function 调用 Lovable AI 支持的模型，无需用户提供API Key
- 测评数据暂存前端 state，后续可接入数据库持久化
- 底部导航栏固定，页面间路由切换
- App.tsx 新增6条路由

