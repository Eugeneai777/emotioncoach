

# 在"微信已绑定其他账号"提示中显示已绑定的账号名称

## 概述
当用户尝试绑定微信时，如果该微信已被其他账号绑定，当前只显示"该微信已绑定其他账号"。需要在提示中增加已绑定账号的名称（如手机号或昵称），帮助用户识别冲突账号。

## 修改内容

### 1. Edge Function（后端）
**文件**: `supabase/functions/wechat-oauth-process/index.ts`

- 在查询 `existingMapping` 时，同时查询已绑定用户的 profile 信息（display_name、phone）
- 在 `already_bound` 错误响应中，返回已绑定账号的脱敏名称（如 `155****1234` 或昵称）

具体改动：
- 第 64-66 行：扩展 select 查询，增加关联 profile 信息
- 第 174-180 行：查询 profiles 表获取已绑定用户的 display_name 和 phone，将脱敏后的账号名加入响应 JSON

### 2. 前端提示更新
**文件**: `src/pages/WeChatOAuthCallback.tsx`（第 47-49 行）
- 解析响应中的 `bound_account_name` 字段
- 更新 toast 提示为：`该微信已绑定其他账号（${accountName}），如需绑定当前账号请先解绑`

**文件**: `src/pages/WeChatAuth.tsx`（第 53-54 行）  
- 同步更新提示文案（如有传递账号名信息）

### 脱敏规则
- 有手机号：显示 `155****1234` 格式
- 无手机号但有昵称：显示昵称
- 都没有：显示 `未知账号`

