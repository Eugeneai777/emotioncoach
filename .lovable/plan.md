

## 为团队成员增加收益看板、推广链接、学员管理 Tab

### 现状
`IndustryPartnerManagement.tsx` 详情页目前有 7 个 Tab（基本信息仅管理员）：创建活动、AI教练、测评、组合产品、团队成员、商城商品、商城订单。

**缺失 3 个 Tab**：收益看板、推广链接、学员管理。

### 修改文件
**`src/components/admin/IndustryPartnerManagement.tsx`**

1. **新增 imports**：
   - `PartnerStats` from `@/components/partner/PartnerStats`
   - `PromotionHub` from `@/components/partner/PromotionHub`
   - `ReferralList` from `@/components/partner/ReferralList`

2. **新增 3 个 TabsTrigger**（插入在"创建活动"之前）：
   - `revenue` — 收益看板
   - `promotion` — 推广链接  
   - `students` — 学员管理

3. **新增 3 个 TabsContent**：
   - **收益看板**：渲染 `<PartnerStats partner={selectedPartner as any} />`，需确保 `fetchPartners` 的 select 包含财务字段（`total_earnings`, `pending_balance`, `available_balance`, `withdrawn_amount`, `total_referrals`, `total_l2_referrals`）
   - **推广链接**：渲染 `<PromotionHub partnerId={selectedPartnerId} currentEntryType={selectedPartner.default_entry_type || 'free'} prepurchaseCount={selectedPartner.prepurchase_count ?? 0} currentSelectedPackages={selectedPartner.selected_experience_packages} />`
   - **学员管理**：渲染 `<ReferralList partnerId={selectedPartnerId} />`

4. **更新 partner 查询**：确认 `fetchPartners` 的 `select('*')` 已包含所有需要的字段（目前应该是 `select('*')` 所以无需改动）

### Tab 顺序
基本信息(管理员) → **收益看板** → **推广链接** → **学员管理** → 创建活动 → AI教练 → 测评 → 组合产品 → 团队成员 → 商城商品 → 商城订单

### 注意事项
- `PartnerStats` 需要 `Partner` 类型，需确认 `selectedPartner` 的类型兼容性，可能需要类型断言
- 收益看板对 partner_admin 可见意味着团队成员可查看财务数据——确认这是预期行为

