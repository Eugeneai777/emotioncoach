# 修复真人教练删除失败

## 问题
管理员点"删除教练"时，无论该教练是否有订单，都会失败。

根因：`ApprovedCoachesList.tsx` 的 `deleteCoachMutation` 里有这一步——

```ts
const tierRes = await (supabase.from("coach_price_tiers") as any)
  .delete().eq("coach_id", coachId).select("id");
```

但 `coach_price_tiers` 是**全局价格档位**表（字段只有 `tier_name / tier_level / price / duration_minutes …`），根本没有 `coach_id` 列。Postgres 直接报 `column "coach_id" does not exist`，整个删除中断，主记录留下来。这就是 18898593978 李先生这条测试数据怎么都删不掉的原因。

## 方案

### 1. 简化 `ApprovedCoachesList.tsx` 的删除逻辑
数据库里这些子表本来就是 `ON DELETE CASCADE`：
- `coach_certifications` ✅
- `coach_services` ✅
- `coach_time_slots` ✅
- `coach_settlements` ✅
- `coach_claim_conflicts`（两个外键）✅

所以根本不需要在前端逐个删，直接 `delete from human_coaches where id = ?` 即可，CASCADE 会自动清理。

而真正会"挡住"删除的是这几张**没有 CASCADE** 的业务表（保护历史数据）：
- `coaching_appointments`（预约订单）
- `appointment_reviews`（评价）
- `camp_coach_assignments`（训练营带教）
- `camp_delivery_reviews`（训练营评价）
- `bloom_delivery_completions`（绽放交付）

只要这几张表里没数据，删除就成功；有数据，就会抛 FK 外键错误 → 已有的 toast "该教练存在历史订单或评价，无法删除，请改为停用" 会触发。

新的 mutation 大致：
```ts
const { data, error } = await supabase
  .from("human_coaches")
  .delete()
  .eq("id", coachId)
  .select("id");
if (error) throw error;
if (!data || data.length === 0) throw new Error("删除失败：未找到记录或无权限");
```

### 2. 18898593978 这条测试数据
按上述代码确认子表都是空的，前端修复后再点一次"删除"就能成功。不需要单独做数据库迁移去硬删。

## 验收
- 测试数据"李先生 18898593978" 可以一键删除，列表立刻消失。
- 若教练已有真实订单/评价，点删除会提示"请改为停用"，主记录保留。
- 已通过列表 + 统计卡片自动刷新。

## 不改动的范围
- 数据库 schema / RLS / 外键
- 其他教练相关组件（编辑、申请详情、上传证书等）
