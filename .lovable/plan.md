

## 已实现 — 无需额外改动

`PhoneNumberManager.tsx` 的 `handleSave` 中（第 96–127 行）**已包含**所请求的全部逻辑：

1. **检测微信临时邮箱**：判断 `user.email` 是否包含 `@temp.youjin365.com`（第 99–100 行）
2. **拼接标准邮箱**：`phone_{区号}{手机号}@youjin.app`（第 101–102 行）
3. **防重复检查**：查询 `profiles` 表确认手机号未被其他账号占用（第 105–111 行）
4. **调用 Edge Function 同步**：通过 `cleanup-duplicate-user` 的 `update-auth-user` 操作更新 auth email（第 114–120 行）
5. **失败不阻塞**：整段逻辑包裹在独立 try/catch 中，同步失败仅 console.warn，不影响手机号保存（第 123–125 行）

此功能已在上一轮对话中实现并部署，当前代码完全符合需求，无需修改。

