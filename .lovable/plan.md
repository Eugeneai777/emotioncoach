

## 修复 真人教练「价格不显示 + 头像缺失」问题

### 根因

**问题 1 · 价格显示 ¥0**
- 管理后台已选「新锐教练 ¥300」，`human_coaches.price_tier_id` 已正确写入档次 ID
- 但 `coach_services.price` 仍是 `0.00`
- **真正原因**：`coach_services` 表 RLS 只有 2 条策略 ——「教练管理自己的」+「公开只读」，**完全没有 admin 管理策略**。管理员从后台调 `useUpdateCoachPriceTier` 同步价格时，UPDATE 被 RLS 静默拒绝（admin 不是 coach 本人），代码也没用 `.select()` 校验返回行数（违反项目「客户端 SDK CRUD 加固标准」），所以前端 toast 显示"成功"，数据库实际未变。

**问题 2 · 头像缺失**
- `human_coaches.avatar_url` 为 NULL
- 上传组件代码正常（写 `community-images/avatars/`）
- 数据库无任何上传记录 → **Lisa 申请时确实没有上传头像**，属于教练资料不全

### 修复方案

#### 1 · 数据库层 · 补 admin RLS 策略 + 修复 Lisa 价格

```sql
-- 让管理员可管理所有 coach_services（与 coach_certifications 标准一致）
CREATE POLICY "管理员可以管理所有服务"
ON public.coach_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 用同步触发器：human_coaches.price_tier_id 变化时，自动同步 coach_services.price
CREATE OR REPLACE FUNCTION public.sync_coach_services_price()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_price numeric;
BEGIN
  IF NEW.price_tier_id IS DISTINCT FROM OLD.price_tier_id AND NEW.price_tier_id IS NOT NULL THEN
    SELECT price INTO v_price FROM coach_price_tiers WHERE id = NEW.price_tier_id;
    UPDATE coach_services SET price = v_price WHERE coach_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sync_coach_services_price
AFTER UPDATE OF price_tier_id ON human_coaches
FOR EACH ROW EXECUTE FUNCTION public.sync_coach_services_price();

-- 立即修复 Lisa 当前数据
UPDATE coach_services
SET price = (SELECT price FROM coach_price_tiers WHERE id = '8314e83e-c87e-44ff-bcf2-129b7a2330f1')
WHERE coach_id = 'a02a5395-df5a-4522-8879-4fffdddd1718';
```

> 选择**触发器 + RLS 双保险**：即使后续前端代码忘加 `.select()` 校验，DB 层也会自动同步，杜绝静默失败。

#### 2 · 前端层 · `src/hooks/useCoachPriceTiers.ts` 加 CRUD 加固

`useUpdateCoachPriceTier` 的两个 `.update()` 都加 `.select()` 并校验返回行数 ≥ 1，命中 RLS 拒绝时立即抛错，避免 toast 误报"成功"。

```ts
const { data: updatedRows, error } = await supabase
  .from("coach_services")
  .update({ price: tier.price })
  .eq("coach_id", coachId)
  .select("id");
if (error) throw error;
if (!updatedRows || updatedRows.length === 0) {
  throw new Error("价格同步失败：无权限或无服务记录");
}
```

#### 3 · 教练详情卡 · 头像兜底

`HumanCoachCard` 与详情页头像位置已有 `Avatar` 组件，但当前 fallback 是 emoji 大头贴。建议：
- `avatar_url` 为空时，显示**姓名首字母**作为 fallback（Lisa → "L"）—— 保持视觉一致
- 详情页顶部增加一行黄底提示："教练正在完善资料 · 头像即将上传"（仅当 `avatar_url IS NULL` 时）

> **不**自动给 Lisa 塞默认图片，让她自己登录教练后台补传更合规。

### 头像如何让 Lisa 补传

教练后台 `/coach-dashboard` 已有资料编辑页，Lisa 重新登录上传即可，无需再走申请流程。如需我们代为协助，可由管理员在 `/admin/human-coaches` 直接编辑 `avatar_url`（依赖现有 admin 策略）。

### 验证标准

1. 数据库：`SELECT price FROM coach_services WHERE coach_id='a02a5395...'` → **300.00**（不再是 0）
2. 前端 `/human-coaches/a02a5395...`：底部价格显示 **起 ¥300**（不再是 ¥0）
3. 管理员未来在后台切换其他教练档次：`coach_services.price` 自动同步（触发器生效）
4. 管理员若手动尝试在 SQL 之外的途径让 RLS 拒绝：toast 弹出"价格同步失败"明确报错（不再静默成功）
5. 头像位：未上传时显示"L"字母 + 黄色提示条，已上传则正常显示图片

