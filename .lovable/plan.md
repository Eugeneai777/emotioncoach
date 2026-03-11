

## 更新 `/parent-teen-intro` 页面 — 融入小劲AI功能介绍

### 问题
当前介绍页内容停留在抽象的"双轨模式"概念，没有展示小劲AI的具体功能（心情探索、天赋发现、未来方向、语音聊天、成长100天挑战、100点免费体验）。家长看完不知道孩子端具体有什么。

### 变更内容

#### 1. 更新 `teenModeGuidance.ts` 配置

**新增** `XIAOJIN_FEATURES` 数组，展示孩子端5大功能：
- 🙂 今天心情 — 3分钟情绪探索，AI温暖倾听
- 🧠 我的天赋 — 发现隐藏超能力
- 🚀 未来方向 — AI帮你看未来
- 📞 随时聊 — 语音对话，像朋友一样倾听
- 🔥 成长100天 — 每天一个问题，遇见更好的自己

**新增** `FREE_QUOTA_INFO` 对象：
- 100点免费体验（≈100次文字 或 ≈12分钟语音）
- 用完后可升级365套餐

**更新** `DUAL_TRACK_BENEFITS`：加入"情绪周报"说明（家长可在亲子教练看到AI生成的周度情绪趋势）

**更新** `HOW_IT_WORKS_STEPS`：简化为3步（生成邀请卡片 → 分享给孩子 → 查看情绪周报）

**更新** `PRIVACY_COMMITMENTS`：增加"家长仅能看到AI生成的情绪趋势摘要"

#### 2. 更新 `ParentTeenIntro.tsx` 页面

新增以下板块：

- **小劲AI功能展示区**（"什么是双轨模式"下方）：展示5大功能卡片，替代当前简陋的"家长版/青少年版"两列
- **免费体验说明区**：100点免费 + 扣费标准说明
- **情绪周报预览区**：展示家长能看到的周报样例截图/描述
- 底部CTA文案更新："分享小劲AI给孩子"

#### 3. 更新 `introShareConfig.ts`

更新 `parentTeen` 配置的 highlights 和 subtitle：
```
highlights: [
  '5大AI功能免费体验100点',
  '情绪/天赋/未来/语音全覆盖',  
  '家长可看AI情绪周报',
]
subtitle: '小劲AI · 孩子的专属成长陪伴'
```

### 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/config/teenModeGuidance.ts` | 新增 XIAOJIN_FEATURES、FREE_QUOTA_INFO；更新 DUAL_TRACK_BENEFITS、HOW_IT_WORKS_STEPS |
| `src/pages/ParentTeenIntro.tsx` | 新增功能展示区、免费体验说明、情绪周报预览；更新CTA |
| `src/config/introShareConfig.ts` | 更新 parentTeen 的 highlights/subtitle |

