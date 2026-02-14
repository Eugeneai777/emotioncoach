

# 邀请状态区分：用户领取 vs 管理员操作

## 问题

当前所有 `claimed` 状态的邀请都显示为"已领取"，无法区分是用户自行领取还是管理员手动设置权益的情况。

## 方案

修改 `BloomPartnerInvitations.tsx` 中的状态显示逻辑：

- **已领取**（绿色）：`status = 'claimed'` 且 `claimed_by` 不为空（用户自行领取）
- **管理员**（紫色）：`status = 'claimed'` 且 `claimed_by` 为空（管理员手动处理）

同时在"领取时间"列，管理员手动处理的记录显示"管理员操作"而非空白。

## 技术细节

修改文件：`src/components/admin/BloomPartnerInvitations.tsx`

1. 修改 `getStatusBadge` 函数，增加 `claimed_by` 参数：

```tsx
const getStatusBadge = (status: string, claimedBy: string | null) => {
  if (status === 'claimed' && !claimedBy) {
    return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">管理员</Badge>;
  }
  // ... 其余不变
};
```

2. 调用处传入 `claimed_by`：

```tsx
<TableCell>{getStatusBadge(inv.status, inv.claimed_by)}</TableCell>
```

3. 领取时间列增加管理员标识：

```tsx
<TableCell>
  {inv.claimed_at 
    ? format(new Date(inv.claimed_at), 'MM-dd HH:mm') 
    : (inv.status === 'claimed' ? '管理员操作' : '-')}
</TableCell>
```

仅修改一个文件中的三处。

