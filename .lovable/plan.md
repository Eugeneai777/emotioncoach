

# 修复财富教练打卡页面 5 个问题

## 问题清单

| # | 操作路径 | 问题 | 根因 |
|---|---------|------|------|
| 1 | 教练对话 Tab → 对话内容 | 显示代码（原始 Markdown） | `ChatMessage.tsx` 的 `cleanMarkdown` 函数只移除了 `**` 和 `*`，未处理代码块（````）、标题（`#`）、列表（`-`）等 Markdown 语法 |
| 2 | 教练对话 Tab → 语音按钮 | 无法输入语音 | `VoiceInputButton` 在微信环境下 `getUserMedia` 不可用时仅弹提示；需检查 `voice-to-text` 边缘函数是否正常部署 |
| 3 | 复制链接按钮 | "链接已复制" 提示一直显示不消失 | `use-toast.ts` 中 `TOAST_REMOVE_DELAY = 1000000`（约 16 分钟），且 `WealthCampInviteCard` 未设置 toast 的 `duration` 参数 |
| 4 | 好友打开复制的链接 | 显示"无效链接，缺少合伙人信息" | 邀请链接 `/wealth-camp-intro?ref=${userId}` 中的 `ref` 是用户 ID 而非合伙人代码。好友在 `WealthCampIntro` 页面点购买后可能跳转到 `PayEntry.tsx`，该页面将 `ref` 当作合伙人代码解析失败 |
| 5 | 重新冥想按钮 | 跳转到 AI 教练对话页面 | 需要进一步确认：`handleRedoMeditation` 代码逻辑正确（设置 `activeTab('today')`），可能是 `meditationCompleted` 状态重置后触发了意外的副作用或页面重新渲染 |

---

## 修复方案

### 修复 1：ChatMessage 显示代码问题

**文件**: `src/components/ChatMessage.tsx`

增强 `cleanMarkdown` 函数，处理更多 Markdown 语法：

```typescript
const cleanMarkdown = (text: string): string => {
  return text
    // 移除代码块 ```...```
    .replace(/```[\s\S]*?```/g, (match) => {
      // 提取代码块内容（去掉语言标识和围栏）
      const content = match.replace(/```\w*\n?/g, '').trim();
      return content;
    })
    // 移除行内代码 `code`
    .replace(/`([^`]+)`/g, '$1')
    // 移除标题 # ## ###
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体 **text**
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // 移除斜体 *text*
    .replace(/\*([^*]+)\*/g, '$1')
    // 移除剩余 *
    .replace(/\*/g, '');
};
```

### 修复 2：语音输入问题

**文件**: `src/components/coach/VoiceInputButton.tsx`

当前代码逻辑在微信环境检测正确，问题可能在 `voice-to-text` 边缘函数。需要：
- 检查 `voice-to-text` 函数日志确认是否正常运行
- 在非微信浏览器中确认是否也无法录音
- 如果是权限问题，添加更明确的错误提示

### 修复 3：Toast 提示不消失

**文件**: `src/components/wealth-camp/WealthCampInviteCard.tsx`

在 toast 调用中显式添加 `duration` 参数：

```typescript
toast({
  title: "链接已复制",
  description: "分享给好友一起突破财富卡点",
  duration: 2000, // 2秒后自动消失
});
```

同时考虑全局修复 `use-toast.ts` 中的 `TOAST_REMOVE_DELAY`，将默认值从 `1000000` 改为合理的 `5000`（5秒）。

### 修复 4：邀请链接无效

**文件**: `src/components/wealth-camp/WealthCampInviteCard.tsx`

问题在于 `ref=${userId}` 使用的是用户 ID（UUID），而非合伙人推广码。当好友通过此链接到达 `WealthCampIntro` 页面后，后续的购买流程会将 `ref` 视为合伙人代码传给 `PayEntry`/`Claim`，导致解析失败。

修复方案：
- 查询当前用户是否有合伙人记录，若有则使用 `partner_code` 作为 `ref`
- 若无合伙人记录，生成一个不带 `ref` 参数的纯分享链接（或使用用户 ID 但在接收端兼容处理）

```typescript
// 优先使用合伙人推广码，无合伙人记录时不带 ref 参数
const inviteUrl = partnerInfo?.code
  ? `${getPromotionDomain()}/wealth-camp-intro?ref=${partnerInfo.code}`
  : `${getPromotionDomain()}/wealth-camp-intro`;
```

### 修复 5：重新冥想跳转问题

**文件**: `src/pages/WealthCampCheckIn.tsx`

`handleRedoMeditation` 的逻辑看起来正确，但可能存在状态竞态：

```typescript
const handleRedoMeditation = () => {
  setMeditationCompleted(false);
  setActiveTab('today');
  // ...
};
```

当 `meditationCompleted` 被设为 false 后，可能触发某些 `useEffect` 导致意外导航。需要：
- 添加日志确认实际执行路径
- 检查是否有 `useEffect` 监听 `meditationCompleted` 变化后执行了导航
- 如果是因为组件重渲染导致的跳转，使用 `useCallback` 和稳定引用避免竞态

---

## 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/components/ChatMessage.tsx` | 增强 `cleanMarkdown` 处理代码块、标题等 |
| `src/components/wealth-camp/WealthCampInviteCard.tsx` | toast 添加 duration；修复邀请链接使用合伙人代码 |
| `src/hooks/use-toast.ts` | 将全局 `TOAST_REMOVE_DELAY` 从 1000000 改为 5000 |
| `src/pages/WealthCampCheckIn.tsx` | 排查重新冥想跳转问题，添加防护逻辑 |
| `src/components/coach/VoiceInputButton.tsx` | 检查并改进语音录制错误处理 |

