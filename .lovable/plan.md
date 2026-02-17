

## 目标

完全禁用绽放合伙人邀请码弹窗提示，使其不再对任何用户触发。

## 方案

最简单的方式：在 `BloomInvitePrompt` 组件中直接返回 `null`，不再调用边缘函数，也不再显示弹窗。

### 修改文件

**`src/components/BloomInvitePrompt.tsx`**

将组件简化为直接返回 `null`，移除所有逻辑（边缘函数调用、状态管理、弹窗渲染）。

```tsx
export function BloomInvitePrompt() {
  return null;
}
```

这样做的好处：
- 保留组件引用，不需要修改 `App.tsx` 中的导入
- 零网络请求开销
- 如果将来需要恢复，只需还原这个文件

