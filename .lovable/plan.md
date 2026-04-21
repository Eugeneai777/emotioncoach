

## 修复教练价格显示一致性 · 林蒿老师 ¥0 → ¥300

### 根因

数据库查询确认：
- **Lisa**：`price_tier_id` → 新锐教练 ¥300，`coach_services.price = 300` ✅
- **林蒿老师**：`price_tier_id` → 新锐教练 ¥300，但 `coach_services.price = 0` ❌

价格同步触发器存在，但**只在 `UPDATE OF price_tier_id` 时触发**：
```sql
CREATE TRIGGER trg_sync_coach_services_price 
AFTER UPDATE OF price_tier_id ON public.human_coaches ...
```

林蒿的服务记录被设置为 0 是因为：
1. 申请时教练自填价格为 0（或未填）
2. 之后管理员通过 BecomeCoach 流程设置了 price_tier，但服务行可能是后来补建的，或 update 时机错位导致触发器没生效
3. 触发器不覆盖 INSERT 场景与"先建服务后定档"的顺序

前端 `HumanCoachDetail.tsx:97`：`lowestPrice = Math.min(...services.map(s => Number(s.price)))` → 直接读 services 表 → 显示 ¥0。

### 修复方案（3 处改动 · 数据 + 触发器 + 前端兜底）

#### 1 · 数据库迁移 · 一次性回填 + 触发器加固

```sql
-- 1.1 回填所有"已设档但服务价为 0"的教练
UPDATE coach_services cs
SET price = cpt.price, updated_at = now()
FROM human_coaches hc
JOIN coach_price_tiers cpt ON cpt.id = hc.price_tier_id
WHERE cs.coach_id = hc.id
  AND hc.price_tier_id IS NOT NULL
  AND (cs.price IS NULL OR cs.price = 0);

-- 1.2 加固触发器：服务表 INSERT 时若教练有档次，自动套用档次价
CREATE OR REPLACE FUNCTION public.apply_tier_price_on_service_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE tier_price numeric;
BEGIN
  IF (NEW.price IS NULL OR NEW.price = 0) THEN
    SELECT cpt.price INTO tier_price
    FROM human_coaches hc
    JOIN coach_price_tiers cpt ON cpt.id = hc.price_tier_id
    WHERE hc.id = NEW.coach_id;
    IF tier_price IS NOT NULL THEN
      NEW.price := tier_price;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_apply_tier_price_on_service_insert
BEFORE INSERT ON public.coach_services
FOR EACH ROW EXECUTE FUNCTION apply_tier_price_on_service_insert();
```

> 双保险：未来无论先定档还是先建服务、无论顺序如何，价格都不会再为 0。

#### 2 · 前端兜底 · `HumanCoachDetail.tsx` & `HumanCoachCard.tsx`

在 `lowestPrice` 计算逻辑中增加"档次价兜底"：

```ts
// HumanCoachDetail.tsx (line ~97)
const servicePrices = services.map(s => Number(s.price)).filter(p => p > 0);
const lowestPrice = servicePrices.length > 0 
  ? Math.min(...servicePrices)
  : (coach.price_tier?.price ?? null);  // 兜底用档次价
```

在 `useHumanCoach` hook 里 join 档次表，让 `coach` 对象带上 `price_tier`（同 `useActiveHumanCoaches` 写法）。

`HumanCoachCard.tsx` 列表卡片的价格显示同步改造（如果有的话）。

#### 3 · 前端最后兜底 · 价格为 null 时不显示 ¥0

底部价格条改为：

```tsx
{lowestPrice !== null && lowestPrice > 0 ? (
  <div>起 <span className="text-2xl font-bold">¥{lowestPrice}</span></div>
) : (
  <div className="text-sm text-muted-foreground">价格待定</div>
)}
```

> 杜绝任何场景下显示 ¥0 误导用户。

### 验证标准

1. **数据库**：`SELECT price FROM coach_services WHERE coach_id='063f4816-...'`（林蒿）→ **300.00**
2. **林蒿详情页** `/human-coaches/063f4816-...`：底部显示「起 ¥300」（不再是 ¥0）
3. **未来新教练**：管理员审核通过并设档时，无论 services 行先建还是后建，价格都自动等于档次价
4. **极端场景**：若教练既无档次又无服务定价 → 显示「价格待定」而不是 ¥0
5. **Lisa**：现有 ¥300 显示不受影响
6. **管理后台**：价格档次切换功能不变

### 不动的内容

- `coach_price_tiers` 表与档次配置
- 已有 `trg_sync_coach_services_price` 触发器（继续保留作 UPDATE 路径双保险）
- BookingDialog 与下单流程

