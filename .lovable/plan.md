

# 更新命名：AI教练改为教练空间 & 同步团队教练名称

## 概述
根据需求更新教练空间页面的命名：
1. 将 "🤖 AI 智能教练" 区块标题改为 "教练空间"
2. 同步更新团队教练相关页面的标题为新名称 "绽放海沃塔 · 团队教练"

## 实现方案

### 1. 修改 CoachSpace 页面
更新 `src/pages/CoachSpace.tsx`：
- 第52-53行：区块标题从 "🤖 AI 智能教练" 改为 "🧭 教练空间"

### 2. 修改团队教练列表页
更新 `src/pages/TeamCoaching.tsx`：
- 第29行：页面标题从 "团队教练" 改为 "绽放海沃塔 · 团队教练"

### 3. 修改团队教练详情页
更新 `src/pages/TeamCoachingDetail.tsx`：
- 第27行：分享标题从 "团队教练课程" 改为 "绽放海沃塔 · 团队教练"

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/pages/CoachSpace.tsx` | 修改 | "AI 智能教练" 改为 "教练空间" |
| `src/pages/TeamCoaching.tsx` | 修改 | 页面标题改为 "绽放海沃塔 · 团队教练" |
| `src/pages/TeamCoachingDetail.tsx` | 修改 | 分享标题改为 "绽放海沃塔 · 团队教练" |

## 修改前后对比

### CoachSpace.tsx
**当前：**
```
<span>🤖</span> AI 智能教练
```

**修改为：**
```
<span>🧭</span> 教练空间
```

### TeamCoaching.tsx
**当前：**
```
<h1 className="font-semibold">团队教练</h1>
```

**修改为：**
```
<h1 className="font-semibold">绽放海沃塔 · 团队教练</h1>
```

### TeamCoachingDetail.tsx
**当前：**
```
title: session?.title || '团队教练课程',
```

**修改为：**
```
title: session?.title || '绽放海沃塔 · 团队教练',
```

## 注意事项
- TeamCoachingEntry 组件的卡片标题已经是 "绽放海沃塔 · 团队教练"，无需修改
- 其他文件中的 "AI教练" 用词属于功能描述，不在本次修改范围内

