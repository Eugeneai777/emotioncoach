

# 移除 identity_bloom 重复的"课程阶段"模块

## 问题

`CampIntro.tsx` 第278-316行从数据库渲染了通用的"课程阶段"模块，而 `IdentityBloomIntroSections` 内的 `CurriculumSection` 已包含相同的4阶课程内容（且视觉更精致）。两者同时展示导致内容重复。

## 方案

修改 `src/pages/CampIntro.tsx` 第279行，在 stages 渲染条件中排除 `identity_bloom`（与 `emotion_bloom` 同理）：

```typescript
// 第279行，将：
{campTemplate.stages && campTemplate.stages.length > 0 && (

// 改为：
{campTemplate.stages && campTemplate.stages.length > 0 && 
 !['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
```

同样检查"你将获得"等其他通用模块是否也需要排除（避免与 `DeliverySection` 重复）。

## 文件变更

| 文件 | 操作 |
|---|---|
| `src/pages/CampIntro.tsx` | 第279行加条件排除 identity_bloom 的通用 stages 渲染；检查并排除其他重复模块 |

