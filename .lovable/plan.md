## 目标
让管理员手动录入教练更顺手：
1. **智能粘贴**：粘贴一段简介/资料文本，由 AI 自动解析出姓名、手机号、头衔、年限、专长、简介等字段并回填表单。
2. **草稿自动保存**：表单内容写入 `localStorage`，关闭/刷新后再次打开自动恢复，提交成功或点「清空草稿」后才清除。

## 实现要点

### 1. 新增边缘函数 `parse-coach-profile`（Lovable AI Gateway）
- 入参：`{ text: string }`
- 调用 `google/gemini-2.5-flash`，system prompt 要求严格输出 JSON：
  ```json
  { "name": "", "phone": "", "title": "", "experience_years": 0,
    "specialties": ["..."], "bio": "" }
  ```
- 不识别的字段返回空串/0/空数组；手机号仅保留 11 位数字。
- 返回 `{ ok: true, data: {...} }`，错误返回中文 message。
- `verify_jwt = true`（默认），仅登录管理员能调用；函数内额外用 `has_role(uid, 'admin')` 校验。
- `supabase/config.toml` 无需特殊配置块。

### 2. 前端改动 `AdminCreateCoachDialog.tsx`

**A. 智能粘贴区**（顶部新增一块）
- 一个折叠面板「📋 智能粘贴（推荐）」，内含 `Textarea` + 「AI 识别填充」按钮。
- 点击后调用 edge function，loading 期间按钮显示 spinner。
- 返回结果**合并到现有 `form`**（仅覆盖非空字段，避免清掉已填好的内容）；`specialties` 数组去重合并。
- 成功后 toast「已自动填充 N 个字段，请核对」。
- 失败用 `extractEdgeFunctionError` 提取并 toast。

**B. 草稿持久化**
- `localStorage` key：`admin-create-coach-draft-v1`
- `useEffect` 监听 `form` / `newSpecialty` 变化，debounce 500ms 写入。
- 组件 mount 时读取，若有草稿则填回，并在标题旁显示「已恢复草稿」小提示 + 「清空草稿」按钮。
- 不持久化 `status`（每次默认「直接通过」更安全）→ 可选：也保存，保持一致。决定**保存所有字段**。
- 关闭对话框（`handleClose`）**不再清空 form**——只在「提交成功」或用户点「清空草稿」时清。
- `createdCoachId` 进入第 2 步后即清掉草稿（已成功落库）。

### 3. 不改动范围
- 不改第 2 步证书上传逻辑。
- 不改数据库结构、RLS。
- 不改非管理员的代他人申请表单（`BecomeCoach.tsx` proxy 模式）。

## 验收
- 在文本框粘贴「张敏，13800001111，国家二级心理咨询师，10 年经验，擅长亲子关系、情绪管理。曾在 XX 任职...」点 AI 识别 → 姓名/手机号/头衔/年限/专长/简介自动出现。
- 填一半关闭对话框，再次打开 → 字段仍在，顶部出现「已恢复草稿 · 清空」。
- 提交成功后再次打开 → 草稿已清。
