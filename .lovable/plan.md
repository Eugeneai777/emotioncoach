

## 优化底部导航「语音教练」按钮文案

### 当前状态
中心按钮下方文字为 `语音教练`（9px），仅是功能名称，用户不清楚点击后会发生什么。

### 方案选项

| 方案 | 文案 | 优点 |
|------|------|------|
| A | **开始对话** | 直接表达动作，用户一看就知道点了会发生什么 |
| B | **聊一聊** | 口语化、亲切，降低心理门槛 |
| C | **语音通话** | 明确告知是语音形式，区别于文字聊天 |

### 推荐：方案 A「开始对话」

理由：动词开头，行动导向；配合 logo 图标，用户能理解"点击 → 开始和 AI 对话"。

### 修改内容

**文件：`src/components/awakening/AwakeningBottomNav.tsx`**

第 215 行，将：
```tsx
<span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">语音教练</span>
```
改为：
```tsx
<span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">开始对话</span>
```

仅改一个字符串，无其他文件变动。

