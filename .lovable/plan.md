

# 修复 /youjin-life/chat 无法返回 /mini-app

## 问题

聊天页面 Header 区域没有返回按钮，也没有使用 `YoujinBottomNav`（虽然已 import）。用户进入后无法返回 `/mini-app`。

## 改动计划

### 修改 `src/pages/YoujinLifeChat.tsx`

在 Header 左侧添加返回按钮，点击导航到 `/mini-app`：

```
<button onClick={() => navigate('/mini-app')} className="p-1 -ml-1">
  <ArrowLeft className="w-5 h-5 text-gray-900" />
</button>
```

将其插入到现有 Header `<div>` 内、标题文字之前（第 230 行前）。

### 不变项
- 聊天功能、输入框、语音等不变
- 不引入 `YoujinBottomNav`（聊天页面底部已有输入栏，底部导航会遮挡）

