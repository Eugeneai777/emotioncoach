

# 身份绽放训练营：先查看详情再购买

## 现状

- `CampTemplateCard.tsx` 第93行和第227行只对 `emotion_bloom` 做了"查看详情"按钮的特殊处理，`identity_bloom` 作为付费营会直接显示"购买 ¥xxx"按钮
- `CampList.tsx` 第411行，`identity_bloom` 走的是通用 `camp-template/${camp.id}` 路由，而非专属介绍页

## 方案

修改 2 处，让 `identity_bloom` 与 `emotion_bloom` 行为一致：

### 1. `src/components/camp/CampTemplateCard.tsx`

- **第93行**：卡片点击条件已包含 bloom 系列（`isBloomCamp` 包含 `identity_bloom`），无需改
- **第227行按钮区域**：将 `emotion_bloom` 的判断扩展为 `['emotion_bloom', 'identity_bloom'].includes(camp.camp_type)`，让 `identity_bloom` 也显示"查看详情"按钮

### 2. `src/pages/CampList.tsx`

- **第404-409行**：在 `emotion_bloom` 分支旁增加 `identity_bloom` 分支，未购用户跳转 `/camp-intro/identity_bloom`，已购用户跳转 `/camp-checkin`

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/camp/CampTemplateCard.tsx` | 扩展"查看详情"按钮条件，覆盖 `identity_bloom` |
| `src/pages/CampList.tsx` | 增加 `identity_bloom` 路由分支 |

