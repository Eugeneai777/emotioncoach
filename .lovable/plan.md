

# 修复：管理员无法手动改变邀请状态

## 问题分析

经过全面排查，代码逻辑、数据库 RLS 策略、用户权限均正确。最可能的原因是 **DropdownMenuItem 的 onClick 事件冒泡问题**：点击菜单项时，事件向上冒泡导致下拉菜单提前关闭，onClick 回调未能正常执行。

## 排查结果

| 检查项 | 状态 |
|--------|------|
| RLS 策略（admin ALL） | 正常 |
| 用户 admin 角色 | 已确认 |
| TypeScript 类型（status: string） | 兼容 |
| DropdownMenu UI 代码 | 存在事件冒泡隐患 |

## 修复方案

在 `BloomPartnerInvitations.tsx` 中，为所有 DropdownMenuItem 的 onClick 添加 `e.stopPropagation()`，防止事件冒泡导致菜单过早关闭：

- 复制邀请链接按钮
- 所有状态切换按钮

## 技术细节

修改文件：`src/components/admin/BloomPartnerInvitations.tsx`

将：
```tsx
<DropdownMenuItem onClick={() => handleCopyLink(inv.invite_code)}>
```
改为：
```tsx
<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(inv.invite_code); }}>
```

同样修改状态切换按钮：
```tsx
<DropdownMenuItem key={s.value} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(inv.id, s.value); }}>
```

仅修改一个文件中的两处 onClick 调用。

