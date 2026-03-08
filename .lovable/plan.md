

## 升级动态测评页面：复制财富卡点测评的完整功能

### 现状分析

当前 `DynamicAssessmentPage.tsx` 是一个简单的单文件页面（318行），仅包含：
- 基础的介绍页、答题页、结果页三阶段
- 简单的维度得分展示
- 基础的 AI 建议生成
- 无需登录、无支付、无历史记录

而财富卡点测评（`WealthAssessmentLite`）拥有完整的商业闭环：注册门槛、付费解锁、历史记录、AI 教练语音解读、二维码引导等。

### 实施计划

#### 1. 数据库：为动态测评添加付费配置字段

在 `partner_assessment_templates` 表中新增：
- `package_key` (text) — 关联 packages 表的产品标识，用于支付
- `require_auth` (boolean, default true) — 是否需要登录
- `require_payment` (boolean, default false) — 是否需要付费解锁结果
- `qr_image_url` (text) — 自定义二维码图片 URL
- `qr_title` (text) — 二维码引导标题文案
- `coach_prompt` (text) — AI 教练解读专用 prompt

#### 2. 重构 DynamicAssessmentPage 为完整功能页

拆分为多个子组件，复制财富测评的核心流程：

- **DynamicAssessmentIntro** — 介绍页（渐变头图 + 维度标签 + 开始按钮）
- **DynamicAssessmentQuestions** — 答题页（进度条 + 选项卡片 + 前后导航）
- **DynamicAssessmentResult** — 结果页（得分仪表盘 + 维度雷达图 + AI 解读 + 二维码卡片）
- **DynamicAssessmentHistory** — 历史记录列表（基于 `partner_assessment_results` 表查询）

页面主流程：
```text
[介绍页] → [答题] → (未登录? → 注册弹窗) → (需付费? → 付费弹窗) → [结果页]
                                                                        ├── AI 教练解读
                                                                        ├── 二维码引导卡
                                                                        ├── 历史记录
                                                                        └── 重新测评
```

#### 3. 认证与支付集成

- **认证**：答题完成后检查 `require_auth`，未登录时弹出 `QuickRegisterStep` 或跳转登录页
- **支付**：复用现有 `AssessmentPayDialog`，传入模板的 `package_key` 和 `title`
- **购买检测**：新增 `useDynamicAssessmentPurchase(packageKey)` hook，查询 orders 表

#### 4. AI 教练解读

- 复用已有的 `generate-partner-assessment-insight` 边缘函数
- 结果页底部添加"AI 教练解读"入口按钮
- 点击后跳转至教练对话页，通过路由 state 传递测评数据（同财富测评模式）

#### 5. 二维码卡片

- 新建 `DynamicAssessmentQRCard` 组件
- 从模板读取 `qr_image_url` 和 `qr_title`
- 若模板未配置二维码则不显示

#### 6. 历史记录

- 基于 `partner_assessment_results` 表查询当前用户 + 当前模板的历史
- 结果页顶部添加"历史记录"入口
- 支持查看历史得分趋势和重新测评

#### 7. 测评编辑器同步更新

在 `AssessmentEditor` 左侧编辑面板中增加新字段的编辑入口：
- 付费开关 + package_key 输入
- 二维码图片上传 + 引导文案
- AI 教练 prompt 编辑

### 涉及文件

| 操作 | 文件 |
|------|------|
| 重写 | `src/pages/DynamicAssessmentPage.tsx` |
| 新建 | `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` |
| 新建 | `src/components/dynamic-assessment/DynamicAssessmentQuestions.tsx` |
| 新建 | `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` |
| 新建 | `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx` |
| 新建 | `src/components/dynamic-assessment/DynamicAssessmentQRCard.tsx` |
| 新建 | `src/hooks/useDynamicAssessmentPurchase.ts` |
| 修改 | `src/components/partner/AssessmentEditor.tsx`（新字段编辑） |
| 修改 | `src/hooks/usePartnerAssessments.ts`（历史记录查询 hook） |
| 迁移 | `partner_assessment_templates` 表新增字段 |

