

# 底部输入栏动态显示"上次聊过"

## 方案

当存在 `lastChat` 数据时，底部输入框的 placeholder 从"想找人说说话..."动态变为"继续聊：{lastChat.summary}..."，点击后自动带入上次话题上下文打开聊天。无 lastChat 时保持原样。

不新增任何额外 UI 行，仅修改 placeholder 和点击行为。

### 改动

| 文件 | 改动 |
|------|------|
| `src/components/mama/MamaBottomInput.tsx` | 新增 `lastChat` / `onContinueChat` props；动态设置 placeholder；点击输入框时如有 lastChat 则调用 onContinueChat |
| `src/pages/MamaAssistant.tsx` | 将 `lastChat` 和 `onContinueChat` 传给 `MamaBottomInput` |
| `src/components/mama/MamaDailyEnergy.tsx` | 移除"上次聊过"按钮及 `lastChat` / `onContinueChat` props |

