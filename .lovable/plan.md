

# 简化邀请码卡片 - 直接显示输入框

## 改动

**文件：`src/components/wealth-block/BloomInviteCodeEntry.tsx`**

将 card 变体从折叠/展开两步交互改为直接显示：

- 移除 `expanded` 状态逻辑（card 变体不再需要）
- 直接显示标题"我有邀请码"+ 输入框 + 领取按钮，无需点击展开
- 保留简洁的玫瑰色边框样式

最终效果：

```text
┌──────────────────────────────────┐
│ 🎁 我有邀请码                    │
│ [请输入邀请码__________] [领取]  │
└──────────────────────────────────┘
```

### 技术细节

card 变体的 JSX 替换为：

```tsx
<div className="rounded-xl border border-rose-200 dark:border-rose-800/40 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 p-3 sm:p-4 space-y-2.5">
  <div className="flex items-center gap-2">
    <Gift className="w-4 h-4 text-rose-500" />
    <p className="text-sm font-medium">我有邀请码</p>
  </div>
  <div className="flex gap-2">
    <Input placeholder="请输入邀请码" ... />
    <Button onClick={handleClaim} ...>领取</Button>
  </div>
</div>
```

只改一个文件，改动很小。

