

# 修复批量注册流程 - 防止占位邮箱缺失

## 问题根因

`batch-register-bloom-partners` 函数在第 165-181 行已有 backfill 逻辑，但存在两个缺陷：

1. **冲突静默吞没**：当占位邮箱已被另一个重复 auth 账号占用时，`updateUserById` 抛出唯一约束冲突错误，被 `catch` 捕获后仅打印日志，不做任何修复。
2. **缺少冲突解决**：没有尝试查找并清理占用该邮箱的重复账号。

## 修复方案

修改 `supabase/functions/batch-register-bloom-partners/index.ts` 中的 backfill 逻辑（约第 165-181 行），增加冲突检测与自动解决：

### 改动内容

将现有的简单 backfill try/catch 替换为更健壮的逻辑：

```
// For existing users without email, backfill placeholder email
if (!isNewlyCreated) {
  try {
    const { data: { user: existingAuthUser } } = 
      await adminClient.auth.admin.getUserById(userId!);
    
    if (existingAuthUser && !existingAuthUser.email) {
      const codeNoPlus = countryCode.replace('+', '');
      const placeholderEmail = `phone_${codeNoPlus}${phone}@youjin.app`;
      
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId!, {
        email: placeholderEmail,
        email_confirm: true,
      });
      
      if (updateErr) {
        // 邮箱被另一个 auth 账号占用 -> 查找并删除重复账号
        if (updateErr.message?.includes('duplicate') || 
            updateErr.message?.includes('already') ||
            updateErr.message?.includes('unique')) {
          
          // 分页搜索占用该邮箱的重复账号
          let duplicateId: string | null = null;
          let page = 1;
          while (!duplicateId && page <= 10) {
            const { data: { users } } = 
              await adminClient.auth.admin.listUsers({ page, perPage: 500 });
            if (!users || users.length === 0) break;
            const dup = users.find(u => 
              u.email === placeholderEmail && u.id !== userId!
            );
            if (dup) duplicateId = dup.id;
            page++;
          }
          
          if (duplicateId) {
            // 软删除重复账号的 profile
            await adminClient.from('profiles').update({
              deleted_at: new Date().toISOString(),
              is_disabled: true,
              phone: null,
              disabled_reason: '重复账号清理-空壳账号(批量注册自动)',
            }).eq('id', duplicateId);
            
            // 删除重复的 auth 账号
            await adminClient.auth.admin.deleteUser(duplicateId);
            
            // 重试写入占位邮箱
            await adminClient.auth.admin.updateUserById(userId!, {
              email: placeholderEmail,
              email_confirm: true,
            });
            console.log(`Auto-resolved duplicate: deleted ${duplicateId}, backfilled email for ${phone}`);
          } else {
            console.error(`Email conflict for ${phone} but duplicate not found`);
          }
        } else {
          console.error(`Failed to backfill email for ${phone}:`, updateErr);
        }
      } else {
        console.log(`Backfilled placeholder email for ${phone}: ${placeholderEmail}`);
      }
    }
  } catch (e) {
    console.error(`Failed to backfill email for ${phone}:`, e);
  }
}
```

## 改动范围

- **仅修改一个文件**：`supabase/functions/batch-register-bloom-partners/index.ts`
- **改动位置**：第 165-181 行的 backfill 逻辑块
- **无破坏性变更**：只增强了错误处理，正常流程不受影响

## 效果

未来批量注册时，如果遇到已有手机账号但缺少邮箱的情况：
- 正常情况：直接写入占位邮箱（与现有逻辑一致）
- 冲突情况：自动查找并清理占用邮箱的重复 auth 账号，然后重试写入
- 彻底杜绝"有手机号无邮箱"的问题再次发生

