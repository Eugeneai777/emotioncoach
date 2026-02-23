

## 教练申请流程 AI 增强

在现有的教练申请四步流程中加入三个 AI 辅助功能，通过已有的 Lovable AI 网关实现（无需额外 API Key）。

---

### 功能一：个人简介 AI 优化（BasicInfoStep）

在"个人简介"文本框下方添加一个"AI 优化简介"按钮：

- 用户填写基础简介后，点击按钮调用 AI
- AI 根据用户填写的姓名、擅长领域、从业年限和原始简介，生成一段更专业、更有权威感和信任感的教练介绍
- 优化后的文本回填到简介输入框，用户可以继续编辑
- 按钮带 loading 状态，优化中禁止重复点击

### 功能二：证书 AI 描述生成（CertificationsStep）

在每张证书卡片中，上传证书图片后显示"AI 生成证书描述"按钮：

- AI 根据证书类型、证书名称、颁发机构等信息，生成一段专业的证书说明文字
- 新增一个"证书描述"字段展示 AI 生成的内容
- 用户可编辑 AI 生成的描述

### 功能三：AI 推荐勋章（SubmitStep）

在确认提交页面，基于用户填写的所有信息（简介、资质、从业年限、擅长领域），AI 给出推荐的初始勋章等级和理由：

- 在提交页展示一个"AI 推荐勋章"区块
- 点击"获取 AI 推荐"按钮，调用 AI 分析所有填写信息
- 展示推荐的勋章（new / certified / preferred / gold）和推荐理由
- 仅供参考，最终勋章由管理员审核决定

---

### 技术实现

#### 新建边缘函数

**`supabase/functions/ai-coach-application/index.ts`**

一个统一的边缘函数，通过 `action` 参数区分三种操作：

1. `action: "optimize_bio"` — 接收 displayName, specialties, yearsExperience, bio，返回优化后的简介文本
2. `action: "generate_cert_description"` — 接收 certType, certName, issuingAuthority，返回证书描述
3. `action: "recommend_badge"` — 接收完整的申请信息，返回推荐勋章和理由

使用 `google/gemini-2.5-flash` 模型，通过 `LOVABLE_API_KEY` 调用 Lovable AI 网关。

#### 修改文件

1. **`src/components/coach-application/BasicInfoStep.tsx`**
   - 在简介 Textarea 下方添加"AI 优化简介"按钮（Sparkles 图标）
   - 按钮仅在简介非空时可用
   - 调用边缘函数，优化后回填

2. **`src/components/coach-application/CertificationsStep.tsx`**
   - 在 Certification 接口新增 `description` 字段
   - 在每张证书卡片中添加证书描述 Textarea
   - 添加"AI 生成描述"按钮，根据证书信息生成描述

3. **`src/components/coach-application/SubmitStep.tsx`**
   - 新增"AI 推荐勋章"区块，包含推荐按钮
   - 点击后展示推荐的勋章类型（复用 CoachBadge 组件）和推荐理由文字

4. **`src/pages/BecomeCoach.tsx`**
   - Certification 接口添加 `description` 字段
   - 提交时将 cert description 一并保存

5. **`supabase/config.toml`**
   - 添加 `[functions.ai-coach-application]` 配置，设 `verify_jwt = false`（函数内部校验）

