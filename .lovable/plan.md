

# 修复：训练营购买用户应免费使用情绪AI教练

## 问题诊断

当前存在 **3 层阻断**，导致已购买用户仍被收费：

### 问题1：`camp_entitlements` 表缺少情绪训练营的权益配置
数据库 `camp_entitlements` 表只有 `wealth_block_21` 的 7 条记录，完全没有 `emotion_stress_7` 和 `emotion_journal_21` 的权益记录。后端 `deduct-quota` 虽然有免费逻辑，但因为查不到配置，所以永远走不到免费路径。

### 问题2：前端文字对话入口 (`usePurchaseOnboarding`) 拦截
`Index.tsx` 发送消息时调用 `requirePurchase()`，只检查 `user_accounts.remaining_quota`，不检查训练营权益。**用户还没走到后端就被弹出购买弹窗了。**

### 问题3：前端语音对话入口 (`CoachVoiceChat.checkQuota`) 拦截
语音对话启动时只检查 `remaining_quota >= 8`，同样不检查训练营权益。**已购用户点语音按钮直接被拦截。**

---

## 修复方案

### 1. 数据库：补充情绪训练营权益配置（SQL Migration）

为 `emotion_stress_7` 和 `emotion_journal_21` 在 `camp_entitlements` 表插入权益记录：

| camp_type | feature_key | is_free |
|-----------|------------|---------|
| emotion_stress_7 | emotion_coach | true |
| emotion_stress_7 | realtime_voice_emotion | true |
| emotion_stress_7 | text_to_speech | true |
| emotion_journal_21 | emotion_coach | true |
| emotion_journal_21 | realtime_voice_emotion | true |
| emotion_journal_21 | text_to_speech | true |

### 2. 前端：`usePurchaseOnboarding` 增加训练营权益检查

在 `checkUserQuota` 中，**先检查用户是否有活跃的训练营**（`training_camps` 表 status=active），如果有则直接放行，不检查 quota。

### 3. 前端：`CoachVoiceChat.checkQuota` 增加训练营权益检查

在检查 `remaining_quota` 之前，先查询用户是否有活跃的情绪类训练营。有则直接返回 `true`。

### 4. 后端 `deduct-quota`：扩展 `checkCampEntitlement` 兼容性映射

当前只做 `camp_type` 精确匹配。需要加入兼容映射：购买了 `synergy_bundle` 的用户，`user_camp_purchases` 中记录的是 `emotion_journal_21`，需要确保能匹配到。（这个实际上已经通过数据库配置解决了——只要 `camp_entitlements` 中有 `emotion_journal_21` 的记录，`user_camp_purchases` 中也是 `emotion_journal_21`，就能匹配上。）

---

## 其他体验问题排查与修复

### 5. 购买成功后跳转逻辑 Bug

`SynergyPromoPage` 中 `handleEnterCamp` 查询 `camp_type IN ['emotion_journal_21', 'synergy_bundle']`，但实际购买回调写入的是 `emotion_stress_7`（根据 memory 记录，协同套餐现已改为情绪解压营）。这意味着购买后点"进入训练营"可能找不到活跃的 camp。**需要将查询条件改为包含 `emotion_stress_7`。**

### 6. 训练营卡片硬编码为"21天情绪日记训练营"

`Index.tsx` 中 `CoachTrainingCamp` 组件 `campName` 硬编码为"21天情绪日记训练营"，但用户可能参加的是 `emotion_stress_7`（7天解压营）。应根据 `activeCamp.camp_type` 动态显示名称。

---

## 文件变更清单

1. **SQL Migration** — 插入 6 条 `camp_entitlements` 记录
2. **`src/hooks/usePurchaseOnboarding.ts`** — `checkUserQuota` 增加活跃训练营检查
3. **`src/components/coach/CoachVoiceChat.tsx`** — `checkQuota` 增加活跃训练营检查
4. **`src/pages/SynergyPromoPage.tsx`** — `handleEnterCamp` 查询条件加入 `emotion_stress_7`
5. **`src/pages/Index.tsx`** — 训练营名称根据 `camp_type` 动态显示

