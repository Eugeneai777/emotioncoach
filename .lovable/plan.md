## 目标
代申请流程去掉短信验证码环节。教练只需输入姓名 + 11 位手机号（+ 可选关系）即可进入下一步填资料；后续提交校验链路保持不变。

## 修改点

### `src/components/coach-application/ProxyVerifyStep.tsx`
- 删除短信相关状态：`code`、`countdown`、`sending`、`verifying`、`startCountdown`、`handleSendCode`。
- 删除 UI：「短信验证码」整个 Label + Input + 获取验证码按钮。
- `handleVerifyAndNext` 改名为 `handleNext`，逻辑简化为：
  - 校验 `coachName.trim()` 非空 → 否则提示「请填写教练姓名」。
  - 校验 `/^\d{11}$/.test(coachPhone)` → 否则提示「请输入11位手机号」。
  - 直接 `onChange({ ...data, verified: true })` 然后 `onNext()`，不调用任何 edge function。
- 顶部说明文案改为：「请填写被代申请教练的真实姓名与手机号，提交后由管理员审核教练资质。」（去掉「短信核验」措辞）
- 移除 `ShieldCheck` 文案中的"核验"语义可保留图标但标题改为「教练基本信息」。
- 底部 ⚠️ 提示保留（同一手机号在审核中/已通过状态唯一，仍然成立）。
- 按钮文案改为「下一步」。

### 不需要改动
- `src/pages/BecomeCoach.tsx`：`handleSubmit` 中 `mode === "proxy" && !proxyData.verified` 闸门仍然有效——ProxyVerifyStep 进入下一步时把 `verified=true` 写入了 data，所以兼容。
- 不删除 `send-sms-code` / `verify-sms-code` edge function（其它流程仍在用，例如登录）。
- 数据库层 `human_coaches.proxy_verified_at` 字段保留，但代申请时写入的时间戳从此仅表示"代理人确认时间"，不再代表短信核验。
- 24h/累计节流 trigger 不变（5/24h、10 累计）作为防滥用兜底。

## 验收
1. 教练点"代他人申请" → 进入 ProxyVerifyStep → 只看到姓名 / 手机号 / 关系（选填）/ 下一步。
2. 输入非 11 位手机号 → 提示「请输入11位手机号」。
3. 姓名+11位手机号填好 → 点"下一步"立即进入填资料步骤，不再发短信。
4. 完整提交链路通畅，后台 `/admin/human-coaches` 可看到 pending 申请。
