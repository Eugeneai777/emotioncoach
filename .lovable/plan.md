

## 问题与方案

### 根因
1. **未登录用户**（第35-38行）、**认证失败**（第48-51行）、**无历史数据**（第179-184行）都返回 `greeting: null`，前端 fallback 到通用语"嗨，今天感觉怎么样？"，没有时段感知
2. **缓存 `staleTime: 0`** 导致每个组件独立请求，同一用户在不同页面/设备看到不同 AI 生成的文案

### 修改内容

#### 1. Edge Function (`supabase/functions/generate-greeting/index.ts`)

**未登录/认证失败时**（第35-38行、第48-51行）：不再返回 null，改为根据 `timePeriod` 返回固定时段问候：

```typescript
const anonymousGreetings: Record<string, string> = {
  '深夜': '夜深了，记得早点休息哦',
  '早上': '早上好，新的一天开始了',
  '中午': '中午好，记得好好吃饭哦',
  '下午': '下午好，今天辛苦了',
  '晚上': '晚上好，放松一下吧',
};
```

**已登录但无历史数据时**（第179-184行）：删除这段"返回 null"逻辑，让时段 + 用户名也走 AI 生成（"炯谦中午好"比通用语好得多）

#### 2. 前端缓存 (`src/hooks/usePersonalizedGreeting.ts`)

```typescript
staleTime: 300000,     // 5分钟内所有组件共享同一条问候
gcTime: 600000,        // 缓存保留10分钟
refetchOnMount: false, // 已有缓存不重新请求
```

#### 3. 默认文案更新

将 `DEFAULT_GREETING` 从固定的"嗨，今天感觉怎么样？"改为根据当前时段动态生成，作为网络请求失败时的最终兜底。

### 改动范围
- `supabase/functions/generate-greeting/index.ts` — 3处 null 分支改为返回时段问候
- `src/hooks/usePersonalizedGreeting.ts` — 缓存策略 + 动态默认文案
- 不影响现有业务逻辑，所有 CTA 组件无需改动

