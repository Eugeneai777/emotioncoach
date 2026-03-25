

# 修复 SCL-90 结果页：未登录用户也展示训练营转化卡片

## 问题

`SCL90Result.tsx` 第73行 `if (!user) return;` 导致未登录用户跳过整个 AI 分析流程，`aiInsight` 为 null，campInvite 卡片永远不渲染。

## 方案

### 修改文件：`src/components/scl90/SCL90Result.tsx`

**改动1：拆分 saveAndAnalyze，让 AI 分析对所有用户执行**

```typescript
useEffect(() => {
  const saveAndAnalyze = async () => {
    // 1. 保存：仅登录用户
    if (user) {
      try { /* 现有保存逻辑不变 */ } catch (err) { ... }
    }

    // 2. AI分析：所有用户都执行（移到 if(user) 外面）
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-scl90', { body: { ... } });
      if (error) throw error;
      setAiInsight(data);
      // 回写数据库仅登录用户
      if (user && hasSaved) { /* update逻辑不变 */ }
    } catch (err) {
      setAiError("AI分析暂时不可用...");
    } finally {
      setIsLoadingAI(false);
    }
  };
  saveAndAnalyze();
}, [result, answers]); // 移除 user 依赖，避免登录状态变化重复触发
```

**改动2：campInvite 卡片增加兜底，确保无条件展示**

将渲染条件从 `{aiInsight?.campInvite && (...)}` 改为始终渲染：
- AI 返回了 campInvite → 用 AI 个性化内容
- AI 失败或未返回 → 用默认内容（headline: "情绪需要一个出口", reason: "通过21天情绪日记训练...", benefits 固定3条）

**改动3：handleJoinCamp 已有未登录处理（第44-48行）**

现有逻辑已正确：未登录时 toast 提示并跳转 `/camp-intro/emotion_journal_21`，该页面内有登录引导。无需修改。

### 不影响的内容
- Edge Function `analyze-scl90` 无需改动（已有 campInvite 兜底）
- 付费版 SCL-90 体验不变
- 登录用户的数据保存逻辑不变

